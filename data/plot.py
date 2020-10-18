import matplotlib.pyplot as plt

f = open("sloane.txt", "r")
lines = f.readlines()

X = []
Y = []
for line in lines:
    x,y = line.split(",")
    X.append(int(x))
    Y.append(int(y))

plt.yscale("log")
plt.xlim(0,1e4)    
plt.scatter(X, Y, color="black", s=0.25)
plt.show()
