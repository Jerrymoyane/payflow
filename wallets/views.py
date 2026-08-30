from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db import transaction
from .models import Wallet
from .serializers import WalletSerializer, DepositSerializer
from transactions.models import Transaction


class WalletView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wallet = request.user.wallet
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)


class DepositView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DepositSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data['amount']

        wallet = request.user.wallet

        with transaction.atomic():
            wallet.balance += amount
            wallet.save()

            txn = Transaction.objects.create(
                user=request.user,
                wallet=wallet,
                type='DEPOSIT',
                amount=amount,
                status='SUCCESS',
                description='Simulated deposit'
            )

        return Response({
            'reference': txn.reference,
            'amount': str(txn.amount),
            'status': txn.status,
            'new_balance': str(wallet.balance)
        })
