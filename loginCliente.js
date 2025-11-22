const { createApp } = Vue;

createApp({
    data() {
        return {
            isRegistering: false,
            isDark: false,
            alerta: {
                visivel: false,
                mensagem: '',
                tipo: 'success'
            },
            formData: {
                email: '',
                senha: '',
                nome: '',
                cpf: '',
                telefone: '',
                endereco: {
                    cep: '',
                    rua: '',
                    numero: '',
                    complemento: '',
                    bairro: '',
                    cidade: '',
                    estado: ''
                }
            }
        };
    },
    mounted() {
        this.isDark = localStorage.getItem('temaEscuro') === 'true';
        document.documentElement.classList.toggle('dark', this.isDark);
    },
    methods: {
        toggleTheme() {
            this.isDark = !this.isDark;
            document.documentElement.classList.toggle('dark', this.isDark);
            localStorage.setItem('temaEscuro', this.isDark);
        },
        toggleRegister() {
            this.isRegistering = !this.isRegistering;
            this.alerta.visivel = false;
            if (!this.isRegistering) {
                this.formData.nome = '';
                this.formData.cpf = '';
                
            }
        },
        mostrarAlerta(msg, tipo = 'success') {
            this.alerta.mensagem = msg;
            this.alerta.tipo = tipo;
            this.alerta.visivel = true;
            setTimeout(() => { this.alerta.visivel = false; }, 3000);
        },
        async handleSubmit() {
            const url = this.isRegistering 
                ? 'https://ecommerce-backend-green-iota.vercel.app/api/cliente/registro' 
                : 'https://ecommerce-backend-green-iota.vercel.app/api/cliente/login';

            const payload = this.isRegistering 
                ? this.formData 
                : { email: this.formData.email, senha: this.formData.senha };

            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem('auth-token-cliente', data.token);
                    localStorage.setItem('cliente-nome', data.user.nome);
                    
                    this.mostrarAlerta(`Bem-vindo, ${data.user.nome}! Redirecionando...`, 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'usuario.html';
                    }, 1500);

                } else {
                    this.mostrarAlerta(data.message || 'Erro na operação.', 'error');
                }
            } catch (error) {
                console.error(error);
                this.mostrarAlerta('Erro de conexão com o servidor.', 'error');
            }
        }
    }
}).mount('#app');