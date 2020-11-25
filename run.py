if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-a",
        "--always-reload-files",
        help="always force reloading the HTML, CSS, and JavaScript files when"
        " the browser reloads",
        action="store_true"
    )
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
