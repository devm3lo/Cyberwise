from django.db import models
from django.contrib.auth.models import AbstractUser

# 1. Tabela Usuario
class Usuario(AbstractUser):
    TIPO_CHOICES = (
        ('visitante', 'Visitante'),
        ('voluntario', 'Voluntário'),
        ('doador', 'Doador'),
        ('admin', 'Admin'),
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='visitante')

    def __str__(self):
        return self.username

# 2. Tabela Instituicao (Precisa vir antes de Campanha para ser referenciada)
class Instituicao(models.Model):
    nome = models.CharField(max_length=150)
    email = models.EmailField(max_length=100, null=True, blank=True)
    telefone = models.CharField(max_length=20, null=True, blank=True)
    endereco = models.CharField(max_length=200, null=True, blank=True)

    def __str__(self):
        return self.nome

# 3. Tabela Campanha
class Campanha(models.Model):
    STATUS_CHOICES = (
        ('planejada', 'Planejada'),
        ('ativa', 'Ativa'),
        ('encerrada', 'Encerrada'),
    )
    
    titulo = models.CharField(max_length=150)
    descricao = models.TextField()
    
    # --- ADICIONE ESTA LINHA AQUI ---
    imagem_capa = models.ImageField(upload_to='campanhas/', null=True, blank=True)
    # --------------------------------
    
    data_inicio = models.DateField()
    data_fim = models.DateField(null=True, blank=True)
    # ... (o resto dos campos) ...
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planejada')
    
    # Relacionamento: Participantes (Usuários)
    participantes = models.ManyToManyField(
        Usuario, 
        related_name='campanhas_participadas',
        blank=True
    )
    
    # Relacionamento: Apoio Institucional (através de tabela intermediária)
    instituicoes_apoio = models.ManyToManyField(
        Instituicao,
        through='ApoioInstituicao',
        related_name='campanhas_apoiadas',
        blank=True
    )

    def __str__(self):
        return self.titulo

# 4. Tabela Intermediária: ApoioInstituicao
class ApoioInstituicao(models.Model):
    instituicao = models.ForeignKey(Instituicao, on_delete=models.CASCADE)
    campanha = models.ForeignKey(Campanha, on_delete=models.CASCADE)
    tipo_apoio = models.CharField(max_length=100, help_text="Ex: Financeiro, Logístico")

    class Meta:
        unique_together = ('instituicao', 'campanha')

    def __str__(self):
        return f"{self.instituicao.nome} apoia {self.campanha.titulo}"

# 5. Tabela Evento
class Evento(models.Model):
    campanha = models.ForeignKey(
        Campanha, 
        on_delete=models.CASCADE, 
        related_name='eventos'
    )
    titulo = models.CharField(max_length=150)
    descricao = models.TextField()
    data_evento = models.DateField()
    local = models.CharField(max_length=200)

    def __str__(self):
        return self.titulo

# 6. Tabela Doacao
class Doacao(models.Model):
    TIPO_CHOICES = (
        ('financeira', 'Financeira'),
        ('material', 'Material'),
    )

    campanha = models.ForeignKey(
        Campanha, 
        on_delete=models.SET_NULL,
        null=True, 
        blank=True,
        related_name='doacoes'
    )
    
    usuario = models.ForeignKey(
        Usuario, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    valor = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descricao = models.TextField(null=True, blank=True)
    data_doacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        nome = self.usuario.username if self.usuario else 'Anônimo'
        return f"Doação de {nome} - {self.tipo}"

# 7. Tabela Ajuda
class Ajuda(models.Model):
    TIPO_CHOICES = (
        ('emocional', 'Emocional'),
        ('tecnica', 'Técnica'),
        ('informativa', 'Informativa'),
    )
    STATUS_CHOICES = (
        ('pendente', 'Pendente'),
        ('em_andamento', 'Em Andamento'),
        ('concluida', 'Concluída'),
    )

    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descricao = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    data_solicitacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pedido de {self.usuario.username} ({self.tipo})"