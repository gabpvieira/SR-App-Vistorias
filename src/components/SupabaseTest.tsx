import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export function SupabaseTest() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [data, setData] = useState<any>(null);

  const testConnection = async () => {
    setStatus('loading');
    setMessage('Testando conexão...');

    try {
      // Test 1: Check if we can connect and read users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      // Test 2: Check step templates by vehicle model
      const { data: cavaloSteps, error: cavaloError } = await supabase
        .from('inspection_steps_template')
        .select('*')
        .eq('vehicle_model', 'cavalo');

      if (cavaloError) throw cavaloError;

      const { data: basculanteSteps, error: basculanteError } = await supabase
        .from('inspection_steps_template')
        .select('*')
        .eq('vehicle_model', 'rodotrem_basculante');

      if (basculanteError) throw basculanteError;

      const { data: graneleiroSteps, error: graneleiroError } = await supabase
        .from('inspection_steps_template')
        .select('*')
        .eq('vehicle_model', 'rodotrem_graneleiro');

      if (graneleiroError) throw graneleiroError;

      setStatus('success');
      setMessage('✅ Conexão com Supabase estabelecida com sucesso!');
      setData({
        users: users?.length || 0,
        cavaloSteps: cavaloSteps?.length || 0,
        basculanteSteps: basculanteSteps?.length || 0,
        graneleiroSteps: graneleiroSteps?.length || 0
      });
    } catch (error: any) {
      setStatus('error');
      setMessage(`❌ Erro: ${error.message}`);
      console.error('Supabase connection error:', error);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Teste de Conexão Supabase</h3>
      
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${
          status === 'loading' ? 'bg-blue-50 dark:bg-blue-900/20' :
          status === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
          status === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
          'bg-slate-50 dark:bg-slate-900/20'
        }`}>
          <p className="text-sm">{message}</p>
        </div>

        {data && (
          <div className="text-sm space-y-2">
            <p>👥 Usuários: {data.users}</p>
            <p>🚛 Etapas Cavalo: {data.cavaloSteps}</p>
            <p>🚛 Etapas Rodotrem Basculante: {data.basculanteSteps}</p>
            <p>🚛 Etapas Rodotrem Graneleiro: {data.graneleiroSteps}</p>
          </div>
        )}

        <Button onClick={testConnection} disabled={status === 'loading'} className="w-full">
          {status === 'loading' ? 'Testando...' : 'Testar Novamente'}
        </Button>
      </div>

      <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900 rounded text-xs">
        <p className="font-semibold mb-1">Configuração:</p>
        <p>URL: {import.meta.env.VITE_SUPABASE_URL || '❌ Não configurado'}</p>
        <p>Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Não configurado'}</p>
      </div>
    </div>
  );
}
