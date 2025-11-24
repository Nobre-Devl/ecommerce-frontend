const { createApp } = Vue;

createApp({
  data() {
    return {
      despesas: [],
      viewMode: 'cards',
      mostrarForm: false,
      editando: false,
      despesaEditandoId: null,
      novaDespesa: {
        descricao: '',
        valor: '',
        dataVencimento: '',
        tipo: 'Variavel',
        status: 'Pendente'
      },
      isDark: false,
      alerta: {
        visivel: false,
        mensagem: '',
        tipo: 'success'
      }
    };
  },

  computed: {
    totalPendente() {
        return this.despesas
            .filter(d => d.status === 'Pendente' || d.status === 'Atrasado')
            .reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);
    }
  },

  mounted() {
    const token = localStorage.getItem('auth-token');
    
    if (!token) {
      alert('Acesso negado. Faça o login primeiro.');
      window.location.href = 'login.html'; 
      return; 
    }

    this.isDark = localStorage.getItem('temaEscuro') === 'true';
    document.documentElement.classList.toggle('dark', this.isDark);
    
    this.buscarDespesas();
  },

  methods: {
    mostrarAlerta(mensagem, tipo = 'success', duracao = 3000) {
      this.alerta.mensagem = mensagem;
      this.alerta.tipo = tipo;
      this.alerta.visivel = true;
      setTimeout(() => {
        this.alerta.visivel = false;
      }, duracao);
    },

    toggleTheme() {
      this.isDark = !this.isDark;
      document.documentElement.classList.toggle('dark', this.isDark);
      localStorage.setItem('temaEscuro', this.isDark);
    },

    toggleForm() {
      this.mostrarForm = !this.mostrarForm;
      if (!this.mostrarForm) this.resetarFormulario();
    },

    async buscarDespesas() {
      const token = localStorage.getItem('auth-token');
      try {
        const res = await fetch('https://ecommerce-backend-green-iota.vercel.app/despesas', {
          headers: { 'auth-token': token }
        });
        if (res.ok) {
            this.despesas = await res.json();
        }
      } catch (error) {
        console.error('Erro ao buscar despesas:', error);
      }
    },

    async salvarDespesa() {
      const token = localStorage.getItem('auth-token');
      
      const metodo = this.editando ? 'PUT' : 'POST';
      const url = this.editando
        ? `https://ecommerce-backend-green-iota.vercel.app/despesas/${this.despesaEditandoId}`
        : 'https://ecommerce-backend-green-iota.vercel.app/despesas';

      try {
        const res = await fetch(url, {
          method: metodo,
          headers: { 
            'Content-Type': 'application/json',
            'auth-token': token 
          },
          body: JSON.stringify(this.novaDespesa)
        });

        if (res.ok) {
          const msg = this.editando ? '✅ Despesa atualizada!' : '✅ Conta registrada!';
          this.mostrarAlerta(msg, 'success');
          this.buscarDespesas();
          this.toggleForm();
        } else {
          const erro = await res.json();
          this.mostrarAlerta('❌ ' + (erro.message || 'Erro ao salvar'), 'error');
        }
      } catch (error) {
        this.mostrarAlerta('❌ Erro de conexão.', 'error');
      }
    },

    editarDespesa(despesa) {
      this.mostrarForm = true;
      this.editando = true;
      this.despesaEditandoId = despesa._id;
      const dataFormatada = despesa.dataVencimento ? despesa.dataVencimento.split('T')[0] : '';
      
      this.novaDespesa = { 
          ...despesa,
          dataVencimento: dataFormatada 
      };
    },

    async pagarConta(id) {
        const token = localStorage.getItem('auth-token');
        try {
            const res = await fetch(`https://ecommerce-backend-green-iota.vercel.app/despesas/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'auth-token': token 
                },
                body: JSON.stringify({ status: 'Pago' })
            });

            if(res.ok) {
                this.mostrarAlerta('💰 Conta paga com sucesso!', 'success');
                this.buscarDespesas();
            }
        } catch (error) {
            this.mostrarAlerta('Erro ao pagar', 'error');
        }
    },

    async excluirDespesa(id) {
      const token = localStorage.getItem('auth-token');
      
      if (!confirm('Tem certeza que deseja apagar esse registro?')) return;

      try {
        const res = await fetch(`https://ecommerce-backend-green-iota.vercel.app/despesas/${id}`, { 
          method: 'DELETE',
          headers: { 'auth-token': token }
        });

        if (res.ok) {
          this.mostrarAlerta('🗑️ Registro removido!', 'success');
          this.buscarDespesas();
        } else {
          this.mostrarAlerta('❌ Erro ao excluir.', 'error');
        }
      } catch (error) {
        this.mostrarAlerta('❌ Erro de conexão.', 'error');
      }
    },

    resetarFormulario() {
      this.editando = false;
      this.despesaEditandoId = null;
      this.novaDespesa = {
        descricao: '',
        valor: '',
        dataVencimento: '',
        tipo: 'Variavel',
        status: 'Pendente'
      };
    },

    formatarMoeda(valor) {
        if(!valor) return 'R$ 0,00';
        return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },
    
    formatarData(dataISO) {
        if(!dataISO) return '-';
        return new Date(dataISO).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    },

    statusClass(status) {
        if (status === 'Pago') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        if (status === 'Atrasado') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    },

    statusBorder(status) {
        if (status === 'Pago') return 'border-green-500';
        if (status === 'Atrasado') return 'border-red-500';
        return 'border-yellow-500';
    }
  }
}).mount('#app');