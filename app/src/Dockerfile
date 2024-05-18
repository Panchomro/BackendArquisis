# We use alpine for a lightweight (less memory) image
FROM node:latest

# Create app directory
WORKDIR /

# Copy the files that declares the dependencies (in this case using yarn)
COPY package*.json app.js ./

# Check if all the files are correct when building
RUN ls -a

# Install the dependencies
RUN npm install

EXPOSE 3000

# Copy all the files into the container to run the app
COPY . .

CMD [ "npm", "run", "dev" ]