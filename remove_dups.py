with open('src/utils/storage.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

first_index = -1
second_index = -1

for i, line in enumerate(lines):
    if 'export const getStorageUsage' in line:
        if first_index == -1:
            first_index = i
        else:
            second_index = i
            break

if second_index != -1:
    lines = lines[:second_index]

with open('src/utils/storage.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Duplicates removed from storage.js!")
