from django.shortcuts import render

# Create your views here.


from rest_framework import generics, permissions
from .serializers import RegisterSerializer, UserSerializer

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    
    
    
    
from rest_framework.views import APIView
from rest_framework.response import Response


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)