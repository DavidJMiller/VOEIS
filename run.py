if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-e",
        "--neighbor-cap",
        help="load at most this many number-neighbors per offset value",
        type=float,  # use float here to allow inputs like 2e9
    )
    parser.add_argument(
        "-n",
        "--number-cap",
        help="load at most this many numbers from the database",
        type=float,
    )
    parser.add_argument(
        "-o",
        "--offset-cap",
        help="load number-neighbors with up to exactly plus and minus this"
        " offset value",
        type=float,
    )
    parser.add_argument(
        "-p",
        "--port",
        help="use this port number instead of the default 6060",
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
        help="load at most this many sequences from the database",
        type=float,
    )
    
    from data import voeis_db
    
    args = parser.parse_args()
    if args.sequence_cap:
        x = int(args.sequence_cap)
        voeis_db.MAX_NUM_SEQUENCES = x
        print(f"Loading up to the first {x:,} sequences")
    
    if args.number_cap:
        x = int(args.number_cap)
        voeis_db.MAX_NUM_NUMBERS = x
        print(f"Loading up to the first {x:,} numbers")
    
    if args.offset_cap:
        x = int(args.offset_cap)
        voeis_db.MAX_NEIGHBOR_OFFSET = x
        print(f"Loading neighbors with offsets within [{-x}, {x}]")
    
    if args.neighbor_cap:
        x = int(args.neighbor_cap)
        voeis_db.MAX_NEIGHBORS_PER_OFFSET = x
        print(f"Loading up to the first {x:,} popular neighbors per offset")
    
    if args.reload: print("Using the Flask reloader")
    
    port = 6060
    if args.port:
        port = args.port
        print(f"Using port number {port}")
    
    from app import app
    
    app.run(host="0.0.0.0", port=port, use_reloader=args.reload)
