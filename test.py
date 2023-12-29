# https://www.geeksforgeeks.org/kahan-summation-algorithm/
def kahanSum(fa):
    total = 0.0
    c = 0.0

    for f in fa:
        y = f - c
        t = total + y
        c = (t - total) - y
        total = t

    return total
