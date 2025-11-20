# No arquivo: backend/api/views.py

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Campanha, Usuario, Evento, Doacao, Ajuda, Instituicao, ApoioInstituicao
from .serializers import (
    CampanhaListSerializer, CampanhaDetailSerializer, 
    UsuarioSerializer, EventoSerializer, DoacaoSerializer, 
    AjudaSerializer, InstituicaoSerializer, ApoioInstituicaoSerializer
)

class CampanhaViewSet(viewsets.ModelViewSet):
    queryset = Campanha.objects.all().order_by('-data_inicio')
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list' or self.action == 'minhas': # Usa o simples para 'minhas' também
            return CampanhaListSerializer
        return CampanhaDetailSerializer

    # --- NOVA AÇÃO: MINHAS CAMPANHAS ---
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def minhas(self, request):
        # Filtra campanhas onde o ID do usuário está na lista de participantes
        user = request.user
        campanhas = Campanha.objects.filter(participantes=user)
        serializer = self.get_serializer(campanhas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def participar(self, request, pk=None):
        try:
            campanha = self.get_object()
        except Campanha.DoesNotExist:
            return Response({'status': 'Campanha não encontrada'}, status=404)
        
        user = request.user
        if user in campanha.participantes.all():
            campanha.participantes.remove(user)
            return Response({'status': 'saiu'})
        else:
            campanha.participantes.add(user)
            return Response({'status': 'entrou'})

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

class EventoViewSet(viewsets.ModelViewSet):
    queryset = Evento.objects.all()
    serializer_class = EventoSerializer

class DoacaoViewSet(viewsets.ModelViewSet):
    queryset = Doacao.objects.all()
    serializer_class = DoacaoSerializer
    permission_classes = [IsAuthenticated] # Só logados veem doações

    # --- FILTRO: SÓ VEJO AS MINHAS DOAÇÕES ---
    def get_queryset(self):
        # Se for superuser, vê tudo. Se não, vê só as suas.
        user = self.request.user
        if user.is_staff:
            return Doacao.objects.all()
        return Doacao.objects.filter(usuario=user)

class AjudaViewSet(viewsets.ModelViewSet):
    queryset = Ajuda.objects.all()
    serializer_class = AjudaSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    # --- FILTRO: SÓ VEJO OS MEUS PEDIDOS ---
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Ajuda.objects.all()
        return Ajuda.objects.filter(usuario=user)

class InstituicaoViewSet(viewsets.ModelViewSet):
    queryset = Instituicao.objects.all()
    serializer_class = InstituicaoSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class ApoioInstituicaoViewSet(viewsets.ModelViewSet):
    queryset = ApoioInstituicao.objects.all()
    serializer_class = ApoioInstituicaoSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]