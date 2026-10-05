from services.payment_service import PaymentProcessor, PaymentPayload

def test_payment_charge_valid():
    proc = PaymentProcessor("mock_gateway")
    payload = PaymentPayload(account_id="acc_001", amount=99.50)
    res = proc.execute_charge(payload)
    assert res["status"] == "success"
    assert res["amount"] == 99.50

def test_payment_charge_invalid():
    proc = PaymentProcessor("mock_gateway")
    payload = PaymentPayload(account_id="acc_002", amount=-10.0)
    try:
        proc.execute_charge(payload)
        assert False, "Should have thrown ValueError"
    except ValueError:
        assert True
