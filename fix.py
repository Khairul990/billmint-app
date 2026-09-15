import sys

with open('src/services/paymentEngine.js', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("id: ", "id: ev_")
code = code.replace("", "")
code = code.replace("note: Reversal of : ,", "note: Reversal of : ,")
code = code.replace("note: Reversal of : ,", "note: Reversal of : ,")

with open('src/services/paymentEngine.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Python replace done")