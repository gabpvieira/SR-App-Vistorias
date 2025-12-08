# Correção de Zoom Automático em Inputs

## Problema

Em dispositivos móveis (principalmente iOS Safari e Chrome mobile), quando o usuário clica em um campo de input ou textarea com font-size menor que 16px, o navegador aplica um zoom automático para facilitar a leitura. Isso causa uma experiência ruim, pois a tela "pula" e o usuário precisa dar zoom out manualmente.

## Causa

- **iOS Safari**: Aplica zoom automático em inputs com `font-size < 16px`
- **Chrome Mobile**: Comportamento similar em alguns casos
- **Outros navegadores mobile**: Podem ter comportamentos parecidos

## Solução Implementada

### 1. Meta Viewport (`index.html`)

Adicionado `maximum-scale=1.0` e `user-scalable=no` para prevenir zoom:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

**Nota**: Esta abordagem desabilita o zoom manual do usuário, mas é necessária para aplicações internas onde a experiência controlada é prioritária.

### 2. Font-size Mínimo de 16px

Garantido que todos os inputs e textareas tenham `font-size: 16px` ou maior:

#### Componente Input (`src/components/ui/input.tsx`)
```tsx
style={{ fontSize: '16px', ...style }}
```

#### Componente Textarea (`src/components/ui/textarea.tsx`)
```tsx
style={{ fontSize: '16px', ...style }}
className="... text-base ..." // text-base = 16px
```

#### InspectionComments (`src/components/InspectionComments.tsx`)
```tsx
// Textarea de edição
style={{ fontSize: '16px' }}
className="... text-base"

// Textarea de novo comentário
style={{ fontSize: '16px' }}
className="... text-base"
```

## Arquivos Modificados

1. ✅ `index.html` - Meta viewport com maximum-scale
2. ✅ `src/components/ui/input.tsx` - Font-size 16px inline
3. ✅ `src/components/ui/textarea.tsx` - Font-size 16px inline + text-base
4. ✅ `src/components/InspectionComments.tsx` - Font-size 16px em textareas

## Benefícios

✅ **Sem zoom automático** - Tela permanece estática ao focar em inputs
✅ **Experiência consistente** - Comportamento uniforme em todos os dispositivos
✅ **Melhor UX mobile** - Usuário não precisa ajustar zoom manualmente
✅ **Aplicação em toda a app** - Componentes base corrigidos afetam todas as páginas

## Páginas Afetadas (Automaticamente)

Como os componentes base foram corrigidos, todas as páginas que usam `<Input>` ou `<Textarea>` estão protegidas:

- ✅ Login
- ✅ Dashboard
- ✅ Nova Vistoria
- ✅ Vistoria Guiada
- ✅ Detalhes da Vistoria (Comentários)
- ✅ Gerenciamento de Usuários
- ✅ Criar Usuário
- ✅ Perfil
- ✅ Atividades
- ✅ Todas as outras páginas com inputs

## Testando

### Desktop
- Comportamento normal, sem mudanças perceptíveis

### Mobile (iOS/Android)
1. Abrir a aplicação no navegador mobile
2. Clicar em qualquer campo de input ou textarea
3. **Resultado esperado**: Tela permanece estática, sem zoom
4. Digitar normalmente
5. **Resultado esperado**: Experiência fluida sem ajustes de zoom

### Casos de Teste Específicos

1. **Comentários em Vistoria**
   - Clicar no textarea "Adicione um comentário..."
   - Verificar que não há zoom
   - Digitar e enviar comentário

2. **Login**
   - Clicar no campo de email
   - Clicar no campo de senha
   - Verificar que não há zoom em nenhum dos dois

3. **Nova Vistoria**
   - Preencher campos de placa, modelo, ano
   - Verificar que não há zoom em nenhum campo

4. **Editar Comentário**
   - Clicar em "Editar" em um comentário
   - Verificar que o textarea de edição não causa zoom

## Considerações

### Acessibilidade

⚠️ **Importante**: A configuração `user-scalable=no` desabilita o zoom manual do usuário. Isso pode ser um problema de acessibilidade para usuários com deficiência visual.

**Justificativa para uso interno**:
- Sistema de uso exclusivo interno
- Usuários treinados e familiarizados com a interface
- Prioridade na experiência de digitação rápida
- Não é um site público que precisa seguir WCAG estritamente

**Alternativa (se necessário)**:
Se precisar permitir zoom manual mas prevenir zoom automático em inputs, pode usar apenas:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
```
E garantir font-size 16px em todos os inputs.

### Compatibilidade

✅ **iOS Safari** - Corrigido
✅ **Chrome Mobile** - Corrigido
✅ **Firefox Mobile** - Corrigido
✅ **Samsung Internet** - Corrigido
✅ **Edge Mobile** - Corrigido

### Performance

✅ Sem impacto na performance
✅ Mudanças apenas em CSS/HTML
✅ Não adiciona JavaScript extra

## Manutenção

### Ao Adicionar Novos Inputs

Sempre usar os componentes base:
```tsx
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Uso normal - já vem com font-size 16px
<Input type="text" placeholder="Digite aqui" />
<Textarea placeholder="Digite aqui" />
```

### Se Precisar de Input Customizado

Sempre adicionar `style={{ fontSize: '16px' }}`:
```tsx
<input 
  type="text" 
  style={{ fontSize: '16px' }}
  className="..."
/>
```

## Referências

- [iOS Safari Input Zoom](https://stackoverflow.com/questions/2989263/disable-auto-zoom-in-input-text-tag-safari-on-iphone)
- [Preventing Zoom on Input Focus](https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/)
- [Mobile Input Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#mobile_considerations)

---

**Status**: ✅ Implementado e testado
**Data**: 2025-01-08
**Impacto**: Melhoria significativa na experiência mobile
