import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Inspection, InspectionPhoto } from './supabase';
import { formatDateTime } from './date-utils';
import { getActivitiesByInspectionId, getActivityPhotos } from './supabase-queries';

interface PDFGeneratorOptions {
  inspection: Inspection;
  photos: InspectionPhoto[];
  userName: string;
}

export async function generateInspectionPDF({
  inspection,
  photos,
  userName,
}: PDFGeneratorOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Cores - Vermelho SR
  const primaryColor: [number, number, number] = [220, 38, 38]; // red-600
  const darkRedColor: [number, number, number] = [185, 28, 28]; // red-700
  const grayColor: [number, number, number] = [107, 114, 128]; // gray-500
  const lightGrayColor: [number, number, number] = [254, 242, 242]; // red-50
  const borderColor: [number, number, number] = [252, 165, 165]; // red-300

  // Helper para adicionar nova página se necessário
  const checkPageBreak = (requiredSpace: number): boolean => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper para adicionar marca d'água em todas as páginas
  const addWatermark = (pageNum: number) => {
    doc.setPage(pageNum);
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(50);
    doc.setFont('helvetica', 'bold');
    doc.saveGraphicsState();
    const gState = new (doc as any).GState({ opacity: 0.1 });
    doc.setGState(gState);
    doc.text('SR VISTORIA', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
    });
    doc.restoreGraphicsState();
  };

  // Helper para carregar imagem (preserva transparência para PNG)
  const loadImage = (url: string, preserveTransparency = false): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Se preservar transparência, não preencher fundo
          if (!preserveTransparency) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0);
          
          // PNG com transparência ou JPEG
          const format = preserveTransparency ? 'image/png' : 'image/jpeg';
          const quality = preserveTransparency ? 1.0 : 0.8;
          resolve(canvas.toDataURL(format, quality));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  };

  // ============================================
  // CABEÇALHO COM LOGO (Apenas página 1)
  // ============================================
  
  // Carregar logo com transparência preservada
  let logoData: string | null = null;
  try {
    logoData = await loadImage('/logo SR.png', true); // true = preservar transparência
  } catch (error) {
    console.error('Erro ao carregar logo:', error);
  }
  
  // Background vermelho
  doc.setFillColor(...primaryColor);
  doc.rect(margin, yPosition, contentWidth, 20, 'F');
  
  // Logo (se carregada) - PNG com transparência
  if (logoData) {
    try {
      // Ajustar tamanho e posição da logo
      const logoWidth = 35;
      const logoHeight = 16;
      doc.addImage(logoData, 'PNG', margin + 3, yPosition + 2, logoWidth, logoHeight);
    } catch (error) {
      console.error('Erro ao adicionar logo:', error);
    }
  }
  
  // Título
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE VISTORIA', pageWidth / 2, yPosition + 13, { align: 'center' });
  
  yPosition += 25;

  // ============================================
  // INFORMAÇÕES DO VEÍCULO
  // ============================================
  
  // Título da seção
  doc.setFillColor(...lightGrayColor);
  doc.rect(margin, yPosition, contentWidth, 10, 'F');
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition, contentWidth, 10);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO VEÍCULO', margin + 3, yPosition + 6.5);
  
  yPosition += 12;

  // Tabela premium de informações do veículo
  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [
      ['Placa', inspection.vehicle_plate || 'N/A'],
      ['Modelo', inspection.vehicle_model_name || 'N/A'],
      ['Ano Fabricação', inspection.vehicle_year?.toString() || 'N/A'],
      ['Ano Modelo', inspection.vehicle_model_year?.toString() || 'N/A'],
      ['Status', inspection.vehicle_status === 'novo' ? 'Novo' : 'Seminovo'],
      ['Tipo de Vistoria', inspection.type === 'troca' ? 'Troca' : 'Manutenção'],
      ['Modelo de Vistoria', inspection.vehicle_model ? 
        inspection.vehicle_model.replace('_', ' ').toUpperCase() : 'Livre'],
    ],
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 4,
      lineColor: borderColor,
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold', 
        cellWidth: 55,
        fillColor: lightGrayColor,
        textColor: [0, 0, 0],
      },
      1: { 
        cellWidth: 'auto',
        fillColor: [255, 255, 255],
      },
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    margin: { left: margin, right: margin },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 12;

  // ============================================
  // INFORMAÇÕES DA VISTORIA
  // ============================================
  
  checkPageBreak(35);
  
  // Título da seção
  doc.setFillColor(...lightGrayColor);
  doc.rect(margin, yPosition, contentWidth, 10, 'F');
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition, contentWidth, 10);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMAÇÕES DA VISTORIA', margin + 3, yPosition + 6.5);
  
  yPosition += 12;

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [
      ['Realizada por', userName],
      ['Data/Hora', formatDateTime(inspection.created_at)],
      ['Status', inspection.status === 'concluida' ? 'Concluída' : 
                inspection.status === 'rascunho' ? 'Rascunho' : 
                inspection.status === 'aprovada' ? 'Aprovada' : 'Rejeitada'],
      ['Total de Fotos', photos.length.toString()],
      ['Vistoria Guiada', inspection.is_guided_inspection ? 'Sim' : 'Não'],
    ],
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 4,
      lineColor: borderColor,
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold', 
        cellWidth: 55,
        fillColor: lightGrayColor,
        textColor: [0, 0, 0],
      },
      1: { 
        cellWidth: 'auto',
        fillColor: [255, 255, 255],
      },
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    margin: { left: margin, right: margin },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 12;

  // Observações (se houver)
  if (inspection.notes) {
    checkPageBreak(35);
    
    // Título da seção
    doc.setFillColor(...lightGrayColor);
    doc.rect(margin, yPosition, contentWidth, 10, 'F');
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, contentWidth, 10);
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES', margin + 3, yPosition + 6.5);
    
    yPosition += 12;

    // Box para observações
    const notesHeight = Math.max(20, Math.ceil(inspection.notes.length / 80) * 5);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPosition, contentWidth, notesHeight);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const splitNotes = doc.splitTextToSize(inspection.notes, contentWidth - 6);
    doc.text(splitNotes, margin + 3, yPosition + 5);
    yPosition += notesHeight + 12;
  }

  // ============================================
  // FOTOS EM 2 COLUNAS
  // ============================================
  
  if (photos.length > 0) {
    checkPageBreak(35);
    
    // Título da seção
    doc.setFillColor(...lightGrayColor);
    doc.rect(margin, yPosition, contentWidth, 10, 'F');
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, contentWidth, 10);
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRO FOTOGRÁFICO', margin + 3, yPosition + 6.5);
    
    yPosition += 14;

    // Ordenar fotos por step_order
    const sortedPhotos = [...photos].sort((a, b) => {
      if (a.step_order && b.step_order) {
        return a.step_order - b.step_order;
      }
      return 0;
    });

    // Configuração de 2 colunas
    const columnWidth = (contentWidth - 4) / 2; // 4mm de gap entre colunas
    const columnGap = 4;
    let currentColumn = 0;
    let columnStartY = yPosition;

    // Processar fotos em 2 colunas
    for (let i = 0; i < sortedPhotos.length; i++) {
      const photo = sortedPhotos[i];
      
      console.log(`Processando foto ${i + 1}/${sortedPhotos.length}, coluna: ${currentColumn}, yPosition: ${yPosition}`);
      
      try {
        const photoHeight = 65;
        const labelHeight = 10;
        const totalHeight = photoHeight + labelHeight + 3;
        
        // Verificar se precisa de nova página ANTES de processar
        const wouldExceedPage = yPosition + totalHeight > pageHeight - margin - 20; // 20mm de margem extra para rodapé
        
        if (wouldExceedPage) {
          console.log(`Foto ${i + 1} excederia página. yPosition: ${yPosition}, totalHeight: ${totalHeight}, limite: ${pageHeight - margin - 20}`);
          
          if (currentColumn === 0) {
            // Se estiver na primeira coluna, tenta segunda coluna
            console.log('Tentando segunda coluna');
            currentColumn = 1;
            yPosition = columnStartY;
            
            // Verificar novamente se cabe na segunda coluna
            const stillWouldExceed = yPosition + totalHeight > pageHeight - margin - 20;
            if (stillWouldExceed) {
              console.log('Não cabe nem na segunda coluna, nova página');
              doc.addPage();
              yPosition = margin;
              columnStartY = yPosition;
              currentColumn = 0;
            }
          } else {
            // Se já está na segunda coluna, nova página
            console.log('Adicionando nova página');
            doc.addPage();
            yPosition = margin;
            columnStartY = yPosition;
            currentColumn = 0;
          }
        }

        const xOffset = currentColumn === 0 
          ? margin 
          : margin + columnWidth + columnGap;
        
        console.log(`Desenhando foto ${i + 1} em x: ${xOffset}, y: ${yPosition}`);

        // Label da foto com borda
        doc.setFillColor(...lightGrayColor);
        doc.rect(xOffset, yPosition, columnWidth, labelHeight, 'F');
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.3);
        doc.rect(xOffset, yPosition, columnWidth, labelHeight);
        
        doc.setTextColor(...grayColor);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const labelText = `${i + 1}. ${photo.label}`;
        const truncatedLabel = labelText.length > 35 ? labelText.substring(0, 32) + '...' : labelText;
        doc.text(truncatedLabel, xOffset + 2, yPosition + 6.5);
        
        yPosition += labelHeight + 1;

        // Carregar e adicionar imagem
        try {
          const imageData = await loadImage(photo.photo_url);
          
          // Calcular dimensões mantendo aspect ratio
          const maxWidth = columnWidth - 4;
          const maxHeight = photoHeight - 4;
          
          let imgWidth = maxWidth;
          let imgHeight = maxHeight;
          
          if (photo.width && photo.height) {
            const aspectRatio = photo.width / photo.height;
            
            if (aspectRatio > maxWidth / maxHeight) {
              imgWidth = maxWidth;
              imgHeight = maxWidth / aspectRatio;
            } else {
              imgHeight = maxHeight;
              imgWidth = maxHeight * aspectRatio;
            }
          }
          
          // Centralizar imagem na coluna
          const imgXOffset = xOffset + (columnWidth - imgWidth) / 2;
          const imgYOffset = yPosition + (photoHeight - imgHeight) / 2;
          
          // Borda da imagem
          doc.setDrawColor(...borderColor);
          doc.setLineWidth(0.3);
          doc.rect(xOffset, yPosition, columnWidth, photoHeight);
          
          doc.addImage(imageData, 'JPEG', imgXOffset, imgYOffset, imgWidth, imgHeight);
          
        } catch (imgError) {
          console.error('Erro ao carregar imagem:', imgError);
          
          // Placeholder
          doc.setFillColor(250, 250, 250);
          doc.rect(xOffset, yPosition, columnWidth, photoHeight, 'F');
          doc.setDrawColor(...borderColor);
          doc.rect(xOffset, yPosition, columnWidth, photoHeight);
          
          doc.setTextColor(...grayColor);
          doc.setFontSize(8);
          doc.text('Imagem não disponível', xOffset + columnWidth / 2, yPosition + photoHeight / 2, { align: 'center' });
        }
        
        // Alternar coluna
        if (currentColumn === 0) {
          // Primeira coluna processada, vai para segunda coluna na mesma linha
          console.log(`Foto ${i + 1}: Coluna 0 → 1, mantendo yPosition: ${yPosition}`);
          currentColumn = 1;
          yPosition = columnStartY; // Volta para o início da linha
        } else {
          // Segunda coluna processada, avança para próxima linha
          const oldY = yPosition;
          yPosition = columnStartY + 65 + 10 + 6; // Avança uma linha completa
          columnStartY = yPosition; // Atualiza início da próxima linha
          currentColumn = 0;
          console.log(`Foto ${i + 1}: Coluna 1 → 0, yPosition: ${oldY} → ${yPosition}`);
        }
        
      } catch (error) {
        console.error(`Erro ao processar foto ${i + 1}:`, error);
      }
    }
    
    console.log(`Total de páginas após fotos: ${doc.getNumberOfPages()}`);
    
    // Ajustar yPosition se terminou na primeira coluna (foto ímpar)
    if (currentColumn === 1) {
      yPosition = columnStartY + 65 + 10 + 6; // Avança para depois da última linha
    }
    
    yPosition += 10;
  }

  // ============================================
  // ATIVIDADES E MANUTENÇÕES
  // ============================================
  
  try {
    const activities = await getActivitiesByInspectionId(inspection.id);
    
    if (activities.length > 0) {
      checkPageBreak(35);
      
      // Título da seção
      doc.setFillColor(...lightGrayColor);
      doc.rect(margin, yPosition, contentWidth, 10, 'F');
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPosition, contentWidth, 10);
      
      doc.setTextColor(...primaryColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ATIVIDADES E MANUTENÇÕES', margin + 3, yPosition + 6.5);
      
      yPosition += 14;
      
      // Processar cada atividade
      for (let actIndex = 0; actIndex < activities.length; actIndex++) {
        const activity = activities[actIndex];
        
        checkPageBreak(30);
        
        // Cabeçalho da atividade
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.3);
        doc.rect(margin, yPosition, contentWidth, 8, 'FD');
        
        doc.setTextColor(...darkRedColor);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `Atividade ${actIndex + 1} - ${activity.type === 'livre' ? 'Livre' : 'Guiada'}`,
          margin + 2,
          yPosition + 5.5
        );
        
        doc.setTextColor(...grayColor);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          formatDateTime(activity.created_at),
          pageWidth - margin - 2,
          yPosition + 5.5,
          { align: 'right' }
        );
        
        yPosition += 10;
        
        // Fotos da atividade
        const activityPhotos = await getActivityPhotos(activity.id);
        
        if (activityPhotos.length > 0) {
          // Configuração de 2 colunas para fotos de atividades
          const columnWidth = (contentWidth - 4) / 2;
          const columnGap = 4;
          let currentColumn = 0;
          let columnStartY = yPosition;
          
          for (let photoIndex = 0; photoIndex < activityPhotos.length; photoIndex++) {
            const actPhoto = activityPhotos[photoIndex];
            
            const photoHeight = 50;
            const labelHeight = 8;
            const totalHeight = photoHeight + labelHeight + 3;
            
            // Verificar quebra de página
            const wouldExceedPage = yPosition + totalHeight > pageHeight - margin - 20; // 20mm de margem extra para rodapé
            
            if (wouldExceedPage) {
              if (currentColumn === 0) {
                currentColumn = 1;
                yPosition = columnStartY;
                
                // Verificar novamente se cabe na segunda coluna
                const stillWouldExceed = yPosition + totalHeight > pageHeight - margin - 20;
                if (stillWouldExceed) {
                  doc.addPage();
                  yPosition = margin;
                  columnStartY = yPosition;
                  currentColumn = 0;
                }
              } else {
                doc.addPage();
                yPosition = margin;
                columnStartY = yPosition;
                currentColumn = 0;
              }
            }
            
            const xOffset = currentColumn === 0 
              ? margin 
              : margin + columnWidth + columnGap;
            
            // Label
            doc.setFillColor(250, 250, 250);
            doc.rect(xOffset, yPosition, columnWidth, labelHeight, 'F');
            doc.setDrawColor(...borderColor);
            doc.setLineWidth(0.2);
            doc.rect(xOffset, yPosition, columnWidth, labelHeight);
            
            doc.setTextColor(...grayColor);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            const actLabelText = actPhoto.label || `Foto ${photoIndex + 1}`;
            const truncatedActLabel = actLabelText.length > 30 ? actLabelText.substring(0, 27) + '...' : actLabelText;
            doc.text(truncatedActLabel, xOffset + 1.5, yPosition + 5);
            
            yPosition += labelHeight + 0.5;
            
            // Imagem
            try {
              const actImageData = await loadImage(actPhoto.photo_url);
              
              const maxWidth = columnWidth - 3;
              const maxHeight = photoHeight - 3;
              
              let imgWidth = maxWidth;
              let imgHeight = maxHeight;
              
              if (actPhoto.width && actPhoto.height) {
                const aspectRatio = actPhoto.width / actPhoto.height;
                
                if (aspectRatio > maxWidth / maxHeight) {
                  imgWidth = maxWidth;
                  imgHeight = maxWidth / aspectRatio;
                } else {
                  imgHeight = maxHeight;
                  imgWidth = maxHeight * aspectRatio;
                }
              }
              
              const imgXOffset = xOffset + (columnWidth - imgWidth) / 2;
              const imgYOffset = yPosition + (photoHeight - imgHeight) / 2;
              
              doc.setDrawColor(...borderColor);
              doc.setLineWidth(0.2);
              doc.rect(xOffset, yPosition, columnWidth, photoHeight);
              
              doc.addImage(actImageData, 'JPEG', imgXOffset, imgYOffset, imgWidth, imgHeight);
              
            } catch (imgError) {
              console.error('Erro ao carregar imagem da atividade:', imgError);
              
              doc.setFillColor(250, 250, 250);
              doc.rect(xOffset, yPosition, columnWidth, photoHeight, 'F');
              doc.setDrawColor(...borderColor);
              doc.rect(xOffset, yPosition, columnWidth, photoHeight);
              
              doc.setTextColor(...grayColor);
              doc.setFontSize(7);
              doc.text('Imagem não disponível', xOffset + columnWidth / 2, yPosition + photoHeight / 2, { align: 'center' });
            }
            
            // Alternar coluna
            if (currentColumn === 0) {
              // Primeira coluna processada, vai para segunda coluna na mesma linha
              currentColumn = 1;
              yPosition = columnStartY; // Volta para o início da linha
            } else {
              // Segunda coluna processada, avança para próxima linha
              currentColumn = 0;
              yPosition = columnStartY + photoHeight + labelHeight + 5; // Avança uma linha completa
              columnStartY = yPosition; // Atualiza início da próxima linha
            }
          }
          
          // Ajustar yPosition se terminou na primeira coluna (foto ímpar)
          if (currentColumn === 1) {
            yPosition = columnStartY + 50 + 8 + 5; // Avança para depois da última linha (50=photoHeight, 8=labelHeight)
          }
        }
        
        yPosition += 8;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar atividades:', error);
  }

  // ============================================
  // RODAPÉ E MARCA D'ÁGUA
  // ============================================
  
  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Adicionar marca d'água
    addWatermark(i);
    
    // Linha separadora vermelha
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.8);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Texto do rodapé
    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    doc.text(
      `Relatório gerado em ${formatDateTime(new Date().toISOString())}`,
      margin,
      pageHeight - 10
    );
    
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // ============================================
  // SALVAR PDF
  // ============================================
  
  const fileName = `Vistoria_${inspection.vehicle_plate}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
