from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db import transaction
from .serializers import AirtimeSerializer
from transactions.models import Transaction


class AirtimePurchaseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AirtimeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data['amount']
        phone_number = serializer.validated_data['phone_number']
        network = serializer.validated_data['network']

        wallet = request.user.wallet

        if wallet.balance < amount:
            return Response(
                {'detail': 'Insufficient balance.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            wallet.balance -= amount
            wallet.save()

            txn = Transaction.objects.create(
                user=request.user,
                wallet=wallet,
                type='AIRTIME',
                amount=amount,
                status='SUCCESS',
                description=f'Airtime purchase - {network} - {phone_number}'
            )

        return Response({
            'reference': txn.reference,
            'amount': str(txn.amount),
            'network': network,
            'phone_number': phone_number,
            'status': txn.status,
            'new_balance': str(wallet.balance)
        })