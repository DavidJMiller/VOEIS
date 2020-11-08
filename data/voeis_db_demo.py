"""
Demonstrates the use of the `voeis_db` module.
"""

import voeis_db

print("Start loading...")
voeis_db.init()
print("Finished loading!")

while True:
    #print(voeis_db.number_data[int(input())])
    #print(voeis_db.search(input(), 2))
    print(voeis_db.more_of_sequence(int(input()), 6))
