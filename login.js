const { createApp } = Vue;

createApp({
  data() {
    return {
      isRegistering: false,
      isDark: false,
      formData: {
        nome: '',
        nomeFantasia: '',
        email: '',
        password: '', // Mantemos como password
        cnpj: '',
        telefone: '',
        imagem: '',
        imagemPreview: null,
        endereco: {
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: ''
        }
      },
      alerta: {
        visivel: false,
        mensagem: '',
        tipo: 'success' 
      }
    };
  },
  mounted() {
    this.isDark = localStorage.getItem('temaEscuro') === 'true';
    document.documentElement.classList.toggle('dark', this.isDark);
  },
  methods: {
    mostrarAlerta(mensagem, tipo = 'success', duracao = 3000) {
      this.alerta.mensagem = mensagem;
      this.alerta.tipo = tipo;
      this.alerta.visivel = true;
      setTimeout(() => { this.alerta.visivel = false; }, duracao);
    },

    toggleTheme() {
      this.isDark = !this.isDark;
      document.documentElement.classList.toggle('dark', this.isDark);
      localStorage.setItem('temaEscuro', this.isDark);
    },

    toggleRegister() {
      this.isRegistering = !this.isRegistering;
      this.resetForm();
    },

    resetForm() {
      this.formData = {
        nome: '',
        nomeFantasia: '',
        email: '',
        password: '',
        cnpj: '',
        telefone: '',
        imagem: '',
        imagemPreview: null,
        endereco: {
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: ''
        }
      };
    },

    carregarImagem(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        this.formData.imagem = e.target.result;
        this.formData.imagemPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    },

    handleSubmit() {
      if (this.isRegistering) {
        this.register();
      } else {
        this.login();
      }
    },

    async register() {
      // Validação do campo que estava dando problema
      if(!this.formData.nomeFantasia) {
         this.mostrarAlerta('Preencha o Nome Fantasia!', 'error');
         return;
      }

      try {
        // Envia o formData direto, pois ele já tem 'password' e o backend espera 'password'
        const res = await fetch('https://ecommerce-backend-green-iota.vercel.app/api/loja/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.formData)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || errorData.message || 'Erro ao cadastrar.');
        }

        this.mostrarAlerta('✅ Loja cadastrada com sucesso! Faça o login.', 'success');
        this.isRegistering = false; 
        this.resetForm();
      } catch (err) {
        console.error("Erro no cadastro:", err);
        this.mostrarAlerta('❌ ' + err.message, 'error');
      }
    },

    async login() {
      try {
        const res = await fetch('https://ecommerce-backend-green-iota.vercel.app/api/loja/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // CORREÇÃO: Enviando 'password' explicitamente
          body: JSON.stringify({
            email: this.formData.email,
            password: this.formData.password 
          })
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Email ou senha inválidos.');
        }

        const data = await res.json();
        
        localStorage.setItem('auth-token', data.token);

        this.mostrarAlerta('✅ Login efetuado com sucesso!', 'success', 1500);
        
        setTimeout(() => {
          window.location.href = 'produtos.html';
        }, 1500);

      } catch (err) {
        this.mostrarAlerta('❌ ' + err.message, 'error');
      }
    }
  }
}).mount('#app');