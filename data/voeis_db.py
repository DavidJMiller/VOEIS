"""
Provides functions to access the VOEIS database.

IMPORTANT: All functions in this module assume that the database has been built.
More specifically, the files "sequences.txt" and "numbers.txt" exist and contain
correctly-formatted data. See build_voeis_db.py for more info.

VOEIS
Qianlang Chen
H 11/26/20
"""

SEQUENCE_DB_PATH = "data/sequences.txt"
NUMBER_DB_PATH = "data/numbers.txt"

MAX_NUM_SEQUENCES = 2**31 - 1
MAX_NUM_NUMBERS = 20_736
MAX_NEIGHBOR_OFFSET = 6
MAX_NEIGHBORS_PER_OFFSET = 12
SLOANES_GAP_MIN_NUM = 0
SLOANES_GAP_MAX_NUM = 10_000

sequence_data = {}
number_data = {}


def init():
    """
    Initializes the database by reading in the database files and
    constructing dictionaries for fast lookups.
    """
    with open(SEQUENCE_DB_PATH, "r") as sequence_db:
        print("  Loading sequences...")
        for i, line in enumerate(sequence_db, 1):
            if i == MAX_NUM_SEQUENCES: break
            if i % 50_000 == 0: print(f"    At sequence {i:,}")
            if not line: continue
            a_num, name, terms = line[:-1].split("\t")
            
            sequence_data[int(a_num)] = {
                "a_num": f"A{a_num.zfill(6)}",
                "name": name,
                "terms": list(map(int, terms.split(" "))),
            }
    
    with open(NUMBER_DB_PATH, "r") as number_db:
        print("  Loading numbers...")
        for i, line in enumerate(number_db, 1):
            if i == MAX_NUM_NUMBERS: break
            if i % 25_000 == 0: print(f"    At number {i:,}")
            if not line: continue
            basic_info, index_counts, neighbors = line[:-1].split("\t")
            num, total_count, total_num_sequences = basic_info.split()
            index_counts = {
                index: count
                for index, count in map(
                    lambda token: map(int, token.split(" ")),
                    index_counts.split(",")
                )
            }
            neighbors = {
                (offset if offset < 0 else offset + 1): (
                    {
                        neighbor: count
                        for neighbor, count in map(
                            lambda token: map(int, token.split(" ")),
                            neighbors_w_offset.split(",")
                            [:MAX_NEIGHBORS_PER_OFFSET]
                        )
                    } if neighbors_w_offset and offset <= MAX_NEIGHBOR_OFFSET
                    else {}
                )
                for offset, neighbors_w_offset in
                enumerate(neighbors.split(";"), -MAX_NEIGHBOR_OFFSET)
            }
            
            number_data[int(num)] = {
                "num": int(num),
                "total_count": int(total_count),
                "total_num_sequences": int(total_num_sequences),
                "index_counts": index_counts,
                "neighbors": neighbors
            }


def get_sequence(a_num):
    """
    Returns a sequence with the specified A-number, which may be an integer or
    a string in the format of "A......"
    """
    if isinstance(a_num, str): a_num = int(a_num[1:])
    if a_num not in sequence_data: return {}
    
    return sequence_data[a_num]


def get_number(num):
    """
    Returns the data of a number.
    """
    if num not in number_data: return {}
    
    return number_data[num]


import pycurl
from io import BytesIO


def search(query, cap=12):
    """
    Performs a search to the online OEIS database and returns the top results.
    """
    query = query.replace(" ", "%20")
    url = f"http://oeis.org/search?q={query}&n={cap}&fmt=text"
    buffer = BytesIO()
    
    curl = pycurl.Curl()
    curl.setopt(curl.URL, url)
    curl.setopt(curl.WRITEDATA, buffer)
    curl.perform()
    curl.close()
    
    res = []
    for token in buffer.getvalue().decode("iso-8859-1").split("%I A")[1:]:
        a_num = int(token[:6])
        if a_num not in sequence_data: continue
        
        res.append(sequence_data[a_num])
    
    return res


def more_of_sequence(a_num, cap=1_728):
    """
    Downloads and returns more terms of a sequence from the online OEIS.
    """
    a_num = f"{a_num:06}" if isinstance(a_num, int) else a_num[1:]
    url = f"http://oeis.org/A{a_num}/b{a_num}.txt"
    buffer = BytesIO()
    
    curl = pycurl.Curl()
    curl.setopt(curl.URL, url)
    curl.setopt(curl.WRITEDATA, buffer)
    curl.perform()
    curl.close()
    
    res = buffer.getvalue().decode("iso-8859-1").split("\n")
    res_len = len(res)
    
    def is_int(s):
        try:
            int(s)
            return True
        except ValueError:
            return False
    
    terms = []
    for i in range(res_len):
        line = res[i].split(" ")
        if len(line) != 2 or not is_int(line[0]) or not is_int(line[1]):
            continue
        
        term = int(line[1])
        if term < -(1 << 31) or term >= (1 << 31): return terms
        
        terms.append(term)
        comment_len = i + 1
        break
    
    for i in range(comment_len, res_len):
        if i - comment_len == cap - 1: break
        term = int(res[i].split(" ")[1])
        if term < -(1 << 31) or term >= (1 << 31): break
        
        terms.append(term)
    
    sequence_data[int(a_num[1:])]['terms'] = terms
    
    return terms


def get_sloanes():
    """
    Returns the "Sloane's Gap" data, which is the number of sequences each
    number has appeared in.
    """
    return {
        num: num_data['total_num_sequences']
        for num, num_data in number_data.items()
        if num >= SLOANES_GAP_MIN_NUM and num <= SLOANES_GAP_MAX_NUM
    }
