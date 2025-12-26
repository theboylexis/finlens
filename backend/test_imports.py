#!/usr/bin/env python
"""Test script to identify the exact error"""
from __future__ import annotations

import sys
import traceback

print("="*60)
print("Testing imports...")
print("="*60)

try:
    print("\n1. Testing pydantic import...")
    from pydantic import BaseModel
    print("   ✓ Pydantic imported successfully")
    
    print("\n2. Testing datetime import...")
    from datetime import date
    print("   ✓ Datetime imported successfully")
    
    print("\n3. Testing simple model...")
    
    class TestModel(BaseModel):
        name: str
        created: date
    
    print("   ✓ Simple model created successfully")
    
    print("\n4. Testing models.py import...")
    import models
    print("   ✓ Models imported successfully")
    
    print("\n5. Testing main.py import...")
    import main
    print("   ✓ Main imported successfully")
    
except Exception as e:
    print("\n" + "="*60)
    print("ERROR FOUND:")
    print("="*60)
    traceback.print_exc()
    print("="*60)
    sys.exit(1)

print("\n" + "="*60)
print("ALL TESTS PASSED!")
print("="*60)
