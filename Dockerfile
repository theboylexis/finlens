# Use official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
# We assume the build context is the root (where this Dockerfile is)
COPY backend/requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code into the container
COPY backend/ .

# Make port available to the world outside this container
# (Note: Railway ignores EXPOSE but it's good practice)
EXPOSE 8080

# Run main.py when the container launches
# Use $PORT environment variable provided by Railway
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
