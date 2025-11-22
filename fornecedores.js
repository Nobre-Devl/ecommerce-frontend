const { createApp } = Vue;

createApp({
  data() {
    return {
      fornecedores: [],
      viewMode: 'cards',
      mostrarForm: false,
      editando: false,
      fornecedorEditandoId: null,
      novoFornecedor: {
        RazaoSocial: '',
        email: '',
        telefone: '',
        endereco: '',
        CNPJ: ''
      },
      isDark: false,
      alerta: {
        visivel: false,
        mensagem: '',
        tipo: 'success'
      }
    };
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
    
    this.buscarFornecedores();
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

    async buscarFornecedores() {
      const token = localStorage.getItem('auth-token');
      try {
        const res = await fetch('https://ecommerce-backend-green-iota.vercel.app/fornecedores', {
          headers: { 'auth-token': token }
        });
        if (res.ok) {
            this.fornecedores = await res.json();
        }
      } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
      }
    },

    async salvarFornecedor() {
      const token = localStorage.getItem('auth-token');
      
      const metodo = this.editando ? 'PUT' : 'POST';
      const url = this.editando
        ? `https://ecommerce-backend-green-iota.vercel.app/fornecedores/${this.fornecedorEditandoId}`
        : 'https://ecommerce-backend-green-iota.vercel.app/fornecedores';

      try {
        const res = await fetch(url, {
          method: metodo,
          headers: { 
            'Content-Type': 'application/json',
            'auth-token': token 
          },
          body: JSON.stringify(this.novoFornecedor)
        });

        if (res.ok) {
          const msg = this.editando ? '✅ Fornecedor atualizado!' : '✅ Fornecedor cadastrado!';
          this.mostrarAlerta(msg, 'success');
          this.buscarFornecedores();
          this.toggleForm();
        } else {
          const erro = await res.json();
          this.mostrarAlerta('❌ ' + (erro.message || 'Erro ao salvar'), 'error');
        }
      } catch (error) {
        this.mostrarAlerta('❌ Erro de conexão.', 'error');
      }
    },

    editarFornecedor(forn) {
      this.mostrarForm = true;
      this.editando = true;
      this.fornecedorEditandoId = forn._id;
      this.novoFornecedor = { ...forn };
    },

    async excluirFornecedor(id) {
      const token = localStorage.getItem('auth-token');
      
      if (!confirm('Tem certeza que deseja remover este fornecedor?')) return;

      try {
        const res = await fetch(`https://ecommerce-backend-green-iota.vercel.app/fornecedores/${id}`, { 
          method: 'DELETE',
          headers: { 'auth-token': token }
        });

        if (res.ok) {
          this.mostrarAlerta('🗑️ Fornecedor removido!', 'success');
          this.buscarFornecedores();
        } else {
          this.mostrarAlerta('❌ Erro ao excluir.', 'error');
        }
      } catch (error) {
        this.mostrarAlerta('❌ Erro de conexão.', 'error');
      }
    },

    resetarFormulario() {
      this.editando = false;
      this.fornecedorEditandoId = null;
      this.novoFornecedor = {
        RazaoSocial: '',
        email: '',
        telefone: '',
        endereco: '',
        CNPJ: ''
      };
    }
  }
}).mount('#app');