"""
Transaction calculation utility with an intentional zero-count division defect
for DevTwin Root-Cause Debugger testing.
"""

def calculate_average_transaction(total_amount: float, count: int) -> float:
    # Intentionally missing validation guard: if count <= 0: raise ...
    return total_amount / count
