"""
The web-application's entry point.

Usage (from the same directory):
    python run.py <settings>

View help:
    python run.py -h

VOEIS
David Miller, Kevin Song, and Qianlang Chen
"""

VERSION = "H 11/26/20"

if __name__ == "__main__":
    import argparse
    from data import voeis_db
    
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-a",
        "--always-reload-files",
        help="always force reloading the HTML, CSS, and JavaScript files when"
        " the browser reloads",
        action="store_true",
    )
    parser.add_argument(
        "-e",
        "--neighbor-cap",
        help="load at most this many number-neighbors per offset value (default"
        f": {voeis_db.MAX_NEIGHBORS_PER_OFFSET})",
        metavar="<cap>",
        type=float,  # use float here to allow inputs like 2e9
    )
    parser.add_argument(
        "-g",
        "--sloanes-gap-range",
        help="load numbers within this range ([min, max]) for the Sloane's Gap"
        f" data (default: {voeis_db.SLOANES_GAP_MIN_NUM},"
        f" {voeis_db.SLOANES_GAP_MAX_NUM})",
        nargs=2,
        metavar=("<min>", "<max>"),
        type=float,
    )
    parser.add_argument(
        "-n",
        "--number-cap",
        help="load at most this many numbers from the database (default:"
        f" {voeis_db.MAX_NUM_NUMBERS})",
        metavar="<cap>",
        type=float,
    )
    parser.add_argument(
        "-o",
        "--offset-cap",
        help="load number-neighbors with up to exactly plus and minus this"
        f" offset value (default: {voeis_db.MAX_NEIGHBOR_OFFSET})",
        metavar="<cap>",
        type=float,
    )
    parser.add_argument(
        "-p",
        "--port",
        help="use this port number instead of the default 6060",
        metavar="<number>",
        type=int,
    )
    parser.add_argument(
        "-r",
        "--reload",
        help="use the Flask reloader, which automatically restarts the server"
        " when any application-dependent file gets modified (this will cause a"
        " restart immediately after the server is first started)",
        action="store_true",
    )
    parser.add_argument(
        "-s",
        "--sequence-cap",
        help="load at most this many sequences from the database (default:"
        f" {voeis_db.MAX_NUM_SEQUENCES})",
        metavar="<cap>",
        type=float,
    )
    parser.add_argument(
        "-v",
        "--version",
        action="version",
        version=VERSION,
    )
    
    args = parser.parse_args()
    if args.sequence_cap:
        x = int(args.sequence_cap)
        print(f"Loading up to the first {x:,} sequences")
        voeis_db.MAX_NUM_SEQUENCES = x
    
    if args.number_cap:
        x = int(args.number_cap)
        print(f"Loading up to the first {x:,} numbers")
        voeis_db.MAX_NUM_NUMBERS = x
    
    if args.offset_cap:
        x = int(args.offset_cap)
        print(f"Loading neighbors with offsets within [{-x}, {x}]")
        voeis_db.MAX_NEIGHBOR_OFFSET = x
    
    if args.neighbor_cap:
        x = int(args.neighbor_cap)
        print(f"Loading up to the first {x:,} popular neighbors per offset")
        voeis_db.MAX_NEIGHBORS_PER_OFFSET = x
    
    if args.sloanes_gap_range:
        x, y = map(int, args.sloanes_gap_range)
        print(f"Loading numbers within [{x}, {y}] for the Sloane's Gap data")
        voeis_db.SLOANES_GAP_MIN_NUM = x
        voeis_db.SLOANES_GAP_MAX_NUM = y
    
    if args.reload: print("Using the Flask reloader")
    
    port = 6060
    if args.port:
        port = args.port
        print(f"Using port number {port}")
    
    if args.always_reload_files:
        print("Always forcing reloading app files")
        from app import routes
        routes.ALWAYS_RELOAD_APP_FILES = True
    
    from app import app
    
    app.run(host="0.0.0.0", port=port, use_reloader=args.reload)
