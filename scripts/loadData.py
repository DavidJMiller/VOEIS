import matplotlib.pyplot as plt

dataFile = open("../data/stripped", "r")
nameFile = open("../data/names", "r")
sloaneFile = open("../data/sloane.txt", "w")
lines = dataFile.readlines()

data = {}
count = 0
print("Loading sequences...")
for line in lines:
    #ignore comments
    if line[0] == "#":
        continue

    # increment count, strip newline char, and update user
    count = count + 1
    line = line.rstrip("\n")    
    if count % 100000 == 0:
        print("\tAt sequence " + str(count))

    # split each line according to rule: A1234567 ,1,2,3,4,...,
    split = line.split(" ")
    seqName = split[0]
    seq = split[1]
    seq = seq.split(",")[1:-1]
    seq = [int(x) for x in seq]    

    # insert seqName:[seq] into dictionary
    data[seqName] = [seq]

count = 0
lines = nameFile.readlines()
print("Loading descriptions...")
for line in lines:
    #ignore comments
    if line[0] == "#":
        continue

    # increment count, strip newline char, and update user
    count = count + 1
    line = line.rstrip("\n")    
    if count % 100000 == 0:
        print("\tAt description " + str(count))

    split = line.split(" ")
    seqName = split[0]
    seqDescription = " ".join(split[1:])
    if seqName in data:
        data[seqName].append(seqDescription)

print("Loaded " + str(len(data)) + " sequences")

print("Computing Sloanes Gap...")
numOccurences = {}
count = 0
for key,value in data.items():
    count += 1
    if count % 100000 == 0:
        print("\tAt sequence " + str(count))
    seq = value[0]
    for x in seq:
        if x in numOccurences:
            numOccurences[x] += 1
        else:
            numOccurences[x] = 1

print("There are " + str(len(numOccurences)) + " unique integers")
count = 0
plt.yscale("log")
for key,value in numOccurences.items():
    count += 1
    sloaneFile.write(str(key) + "," + str(value) + "\n")
    if count % 100 == 0:
        print(count)
sloaneFile.close()
