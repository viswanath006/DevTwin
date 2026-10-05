import pytest
from services.broken_calculator import calculate_average_transaction

def test_calculate_average_valid():
    assert calculate_average_transaction(100.0, 4) == 25.0

def test_calculate_average_zero_division():
    # Calling with count = 0 triggers ZeroDivisionError: division by zero
    calculate_average_transaction(500.0, 0)
