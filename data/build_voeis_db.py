"""
Builds the VOEIS database from the raw data and precomputes helpful data.

IMPORTANT: this program should be run within the root directory.

The VOEIS database consists of two plain-text files:
    
    sequences.txt: Records information of the OEIS sequences.
    
        Format: each sequence will be described by one line:
            <a_num>\t<name>\t<terms>
        
        Attributes:
            a_num: The sequence's A-number converted into an integer (without
                the leading "A"). For example, the sequence A000042 will have
                an `a_num` of 42.
            name: The name of the sequence.
            terms: The array of values in the sequences that are converted into
                32-bit integers, separated by spaces. The values that don't fit
                in 32 bits will be thrown away.
    
    numbers.txt: Records the info for the numbers that has appeared across all
        sequences in OEIS.
        
        Format: each number will be described by one line (newlines
            are for decorations only):
            <num> <total_count> <total_num_sequences>\t
            <index_counts>\t
            <offset_neg_6_neighbors>;
            <offset_neg_5_neighbors>;
            <offset_neg_4_neighbors>;
            <offset_neg_3_neighbors>;
            <offset_neg_2_neighbors>;
            <offset_neg_1_neighbors>;
            <offset_pos_1_neighbors>;
            <offset_pos_2_neighbors>;
            <offset_pos_3_neighbors>;
            <offset_pos_4_neighbors>;
            <offset_pos_5_neighbors>;
            <offset_pos_6_neighbors>
        
        Attributes:
            num: The number whose info is recorded by this object.
            total_count: The total number of times the number has appeared
                across all sequences in OEIS.
            total_num_sequences: The total number of sequences the number has
                appeared in. Not necessarily equal to `total_count` since a
                number may appear multiple times in one sequence.
            index_counts: The number of times the number has appeared in at each
                index across all sequences. For example, a pair "3 42"
                indicates that this number has appeared 42 times as a 3rd
                element of any sequence. Commas separate pairs, and spaces
                separete the two values in the pair.
            offset_SIG_X_neighbors:  The list of "popular neighbors" this
                number has that are `SIG_X` elements away in any sequence. A
                popular neighbor of a number N is another number M that
                frequently appears around N across all sequences. For example, a
                pair "3 42" occurs in `offset_neg_2_neighbors` indicates that
                number 3 appear 2 spots before N in any sequence 42 times. This
                list contains a maximum of twelve most popular neighbors for
                each `SIG_X` and contains `SIG_X`-valued [-6, 6]. Commas
                separate pairs, and spaces separete the two values in the pair.

This program overrides the contents of any existing database files when writing
the new ones.

VOEIS
Qianlang Chen
H 11/05/20
"""

SEQUENCE_FILE_PATH = "data/raw/stripped"
NAME_FILE_PATH = "data/raw/names"

SEQUENCE_DB_PATH = "data/sequences.txt"
NUMBER_DB_PATH = "data/numbers.txt"

MAX_NEIGHBOR_OFFSET = 6
MAX_NEIGHBORS_PER_OFFSET = 12

NUM_STEPS = 3
TEST_LIMIT = int(2e9)  # testing purposes: stop at this to speed up

# Ask to make sure so the user wouldn't accidentally override existing data.

print("Build database? This will override existing data. yes/[no]")
if (input() != "yes"):
    import sys
    sys.exit()

# Load and process the raw data.

curr_step = 1
print(f"Loading sequence names... (step {curr_step} of {NUM_STEPS})")
curr_step += 1

sequence_names = {}
num_sequences = 0
with open(NAME_FILE_PATH, "r") as name_file:
    for line in name_file:
        # Skip comments and blank lines.
        if not line or line[0] != "A": continue
        
        num_sequences += 1
        if num_sequences > TEST_LIMIT: break
        
        # Load in the name.
        a_num = int(line[1:7])
        sequence_names[a_num] = line[8:-1]

print("Loading sequences, counting numbers, and writing sequence data... (step"
      f" {curr_step} of {NUM_STEPS})")
curr_step += 1

number_data = {}
with open(SEQUENCE_FILE_PATH, "r") as sequence_file:
    with open(SEQUENCE_DB_PATH, "w") as sequence_db:
        number_appeared_sequences = {}
        number_neighbors = {}
        i = 0
        sequence_data_len = len(sequence_names)
        for line in sequence_file:
            # Skip comments and blank lines.
            if not line or line[0] != "A": continue
            
            i += 1
            if i % 10_000 == 0:
                print(f"    At sequence {i:,} of {sequence_data_len:,}")
            if i > TEST_LIMIT: break
            
            # Load in the sequence.
            a_num = int(line[1:7])
            terms = list(
                filter(lambda x: x >= -(1 << 31) and x < (1 << 31),
                       map(int, line[9:-2].split(","))))  # filter non 32-bits
            if not terms: continue # empty sequence (after filtering)
            
            sequence_db.writelines([
                str(a_num) + "\t",
                sequence_names[a_num] + "\t",
                " ".join(map(str, terms)) + "\n",
            ])
            
            # Update the counts of numbers.
            sequence_len = len(terms)
            for j, num in enumerate(terms):
                if num not in number_data:
                    # [total_count, appeared_sequences, index_counts, neighbors]
                    number_data[num] = [
                        0,
                        set(), {},
                        [{} for _ in range(2 * MAX_NEIGHBOR_OFFSET + 1)]
                    ]
                
                number_data[num][0] += 1  # total_count
                number_data[num][1].add(a_num)  # appeared_sequences
                if j not in number_data[num][2]:
                    number_data[num][2][j] = 0
                number_data[num][2][j] += 1  # index_counts
                for offset in range(2 * MAX_NEIGHBOR_OFFSET + 1):
                    if offset == MAX_NEIGHBOR_OFFSET: continue
                    tar_index = j - MAX_NEIGHBOR_OFFSET + offset
                    if tar_index < 0 or tar_index >= sequence_len: continue
                    target = terms[tar_index]
                    if target not in number_data[num][3][offset]:
                        number_data[num][3][offset][target] = 0
                    number_data[num][3][offset][target] += 1  # neighbor

print("Selecting most popular number neighbors and writing number data..."
      f" (step {curr_step} of {NUM_STEPS})")
curr_step += 1

import heapq

number_data_len = len(number_data)
with open(NUMBER_DB_PATH, "w") as number_db:
    for i, (num, data) in enumerate(number_data.items(), 1):
        if i % 10_000 == 0: print(f"    At number {i:,} of {number_data_len:,}")
        
        lines = [
            str(num) + " ",
            str(data[0]) + " ",
            str(len(data[1])) + "\t",
            ",".join([f"{index} {count}"
                      for index, count in data[2].items()]) + "\t",
            ";".join([
                ",".join([
                    f"{neighbor} {count}" for neighbor, count in heapq.nlargest(
                        MAX_NEIGHBORS_PER_OFFSET, data[3][offset].items(),
                        lambda x: x[1])
                ]) for offset in range(2 * MAX_NEIGHBOR_OFFSET + 1)
                if offset != MAX_NEIGHBOR_OFFSET
            ]) + "\n",
        ]
        number_db.writelines(lines)

print("Done!")
