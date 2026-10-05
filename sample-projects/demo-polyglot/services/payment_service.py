from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Payment Gateway Service")

class PaymentPayload(BaseModel):
    account_id: str
    amount: float
    currency: str = "USD"

class PaymentProcessor:
    def __init__(self, provider: str = "stripe"):
        self.provider = provider

    def execute_charge(self, payload: PaymentPayload):
        if payload.amount <= 0:
            raise ValueError("Amount must be positive")
        return {"status": "success", "tx_id": "tx_998124", "amount": payload.amount}

processor = PaymentProcessor()

@app.get("/api/payments/health")
def health_check():
    return {"status": "healthy", "service": "payment-api"}

@app.post("/api/payments/charge")
def charge_customer(payload: PaymentPayload):
    try:
        return processor.execute_charge(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
