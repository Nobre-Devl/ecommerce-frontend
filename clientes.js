const { createApp } = Vue;

createApp({
  data() {
    return {
      clientes: [],
      mostrarForm: false,
      editando: false,
      clienteEditandoId: null,
      novoCliente: {
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        endereco: ''
      },
      isDark: false,
      alerta: { visivel: false, mensagem: '', tipo: 'success' }
    };
  },

  mounted() {
    // Proteção de Rota
    const token = localStorage.getItem('auth-token');
    if (!token) {
      alert('Acesso negado. Faça o login.');
      window.location.href = 'login.html';
      return;
    }

    this.isDark = localStorage.getItem('temaEscuro') === 'true';
    document.documentElement.classList.toggle('dark', this.isDark);
    this.buscarClientes();
  },

  methods: {
    mostrarAlerta(msg, tipo = 'success') {
      this.alerta.mensagem = msg;
      this.alerta.tipo = tipo;
      this.alerta.visivel = true;
      setTimeout(() => { this.alerta.visivel = false; }, 3000);
    },

    async buscarClientes() {
      const token = localStorage.getItem('auth-token');
      try {
        const res = await fetch('https://ecommerce-backend-green-iota.vercel.app/clientes', {
          headers: { 'auth-token': token }
        });
        
        // Verifica falha de autenticação ou servidor
        if (!res.ok) {
            const errorBody = await res.json();
            throw new Error(errorBody.message || 'Falha ao autenticar ou buscar dados.');
        }

        this.clientes = await res.json();
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        this.mostrarAlerta(`❌ ${error.message || 'Erro ao buscar clientes.'}`, 'error');
      }
    },

    async salvarCliente() {
      const token = localStorage.getItem('auth-token');
      const metodo = this.editando ? 'PUT' : 'POST';
      const url = this.editando 
        ? `https://ecommerce-backend-green-iota.vercel.app/clientes/${this.clienteEditandoId}` 
        : 'https://ecommerce-backend-green-iota.vercel.app/clientes';

      try {
        const res = await fetch(url, {
          method: metodo,
          headers: { 
            'Content-Type': 'application/json', 
            'auth-token': token 
          },
          body: JSON.stringify(this.novoCliente)
        });

        // 🚨 MELHORIA AQUI: Leitura e exibição do erro detalhado do Backend
        if (!res.ok) {
            const errorBody = await res.json();
            throw new Error(errorBody.message || 'Erro de validação ou de servidor.');
        }

        if (res.ok) {
          this.mostrarAlerta(this.editando ? '✅ Cliente atualizado!' : '✅ Cliente cadastrado!');
          this.buscarClientes();
          this.toggleForm();
        } 
      } catch (error) {
        // Exibe a mensagem de erro exata (se for de validação)
        this.mostrarAlerta(`❌ ${error.message || 'Erro de conexão.'}`, 'error');
      }
    },

    async excluirCliente(id) {
      if (!confirm('Excluir este cliente?')) return;
      const token = localStorage.getItem('auth-token');
      
      try {
        const res = await fetch(`https://ecommerce-backend-green-iota.vercel.app/clientes/${id}`, {
          method: 'DELETE',
          headers: { 'auth-token': token }
        });

        if (!res.ok) {
            const errorBody = await res.json();
            throw new Error(errorBody.message || 'Falha ao deletar.');
        }

        if (res.ok) {
          this.mostrarAlerta('🗑️ Cliente removido!');
          this.buscarClientes();
        } 
      } catch (error) {
        this.mostrarAlerta(`❌ ${error.message || 'Erro de conexão.'}`, 'error');
      }
    },

    toggleForm() {
      this.mostrarForm = !this.mostrarForm;
      // Limpa o form ao fechar ou ao abrir para criar novo
      if (!this.mostrarForm || !this.editando) {
        this.resetarFormulario();
      }
    },

    editarCliente(cliente) {
      this.mostrarForm = true;
      this.editando = true;
      this.clienteEditandoId = cliente._id;
      this.novoCliente = { ...cliente };
    },

    resetarFormulario() {
      this.editando = false;
      this.clienteEditandoId = null;
      this.novoCliente = {
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        endereco: ''
      };
    },

    toggleTheme() {
      this.isDark = !this.isDark;
      document.documentElement.classList.toggle('dark', this.isDark);
      localStorage.setItem('temaEscuro', this.isDark);
    }
  }
}).mount('#app');