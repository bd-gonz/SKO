#!/bin/bash

# Start the backend server
echo "Starting backend server..."
cd backend
npm start &

# Start the frontend server
echo "Starting frontend server..."
cd ../frontend
python3 -m http.server 8080 &

echo "Both servers are running."