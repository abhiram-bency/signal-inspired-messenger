import argparse
import asyncio
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.database import init_db, engine, Base
from app.database.seed import seed_database

async def reset_db():
    print("Dropping all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("Tables dropped.")
    await init_db()
    print("Database initialized.")

async def main():
    parser = argparse.ArgumentParser(description="Manage the Signal-inspired Messenger database.")
    parser.add_argument("--reset", action="store_true", help="Drop all tables and recreate before seeding.")
    parser.add_argument("--seed", action="store_true", help="Seed the database with mock data.")
    
    args = parser.parse_args()
    
    if args.reset:
        await reset_db()
    else:
        # Just ensure tables exist if not resetting
        await init_db()
        
    if args.seed or args.reset:
        await seed_database()

if __name__ == "__main__":
    asyncio.run(main())
