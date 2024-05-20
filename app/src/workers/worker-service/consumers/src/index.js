const { Worker, Job } = require("bullmq");
const axios = require("axios");
require("dotenv").config();

async function fetchLatLonFromIP(ip) {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=lat,lon`);
    return response.data;
  } catch (error) {
    console.error("Error fetching latitude and longitude from IP:", error);
    return null;
  }
}

async function fetchLocationFromAdress(address) {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.GOOGLE_API_KEY}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching latitude and longitude from IP:", error);
    return null;
  }
}


// Function to simulate processing of a job
async function processJob(job) {
  // Fetch last 20 entries from the database

  const { user_ip, flightData, flightsForWorkers } = job.data;

  // const ip = job.data.user_ip;
  //get location from ip
  const location = await fetchLatLonFromIP(user_ip);
  if (!location) {
    console.log("Failed to fetch latitude and longitude for IP:", ip);
  }
  // const flightBought = job.data.flightBought;
  // const entries = await fetchLast20Entries(flightBought.arrival_airport_time, flightBought.arrival_airport_id);
  // if (!entries) {
  //   console.log("Failed to fetch last 20 entries");
  // }
  // Calculate top 3 recommendations
  let array_pond = [];
  let array_entries = [];
  for (let entry of flightsForWorkers) {
    const address = await fetchLocationFromAdress(entry.departure_airport_name);
    if (!address) {
      console.log("Failed to fetch address for entry:", entry);
      continue;
    }
    const lat = address.results[0].geometry.location.lat;
    const lon = address.results[0].geometry.location.lon;
    const ponderator = (Math.sqrt(( location.lat-lat) ** 2 + (location.lon - lon) ** 2))/entry.price;
    if (length(array_pond) < 3){
      array_pond.push(ponderator);
      array_entries.push(entry);
    }
    else{
      for (let i = 0; i < 3; i++){
        if (array_pond[i] < ponderator){
          array_pond[i] = ponderator;
          array_entries[i] = entry;
          break;
        }
      }
    }
    


    //https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&amp;key=YOUR_API_KEY

  }
  
  // Log the fetched entries
  console.log("Last 20 entries:", entries);

  // Save recommendations to backend
  try {
    await axios.post(`${process.env.BACKEND_URL}/recommendations`, {
      user_ip: ip,
      recommendations: array_entries.slice(0, 3),
    });
    console.log("Recommendations saved to backend");
  } catch (error) {
    console.error("Error saving recommendations to backend:", error);
  }
  // Optionally report some progress
  await job.updateProgress(42);

  // Optionally sending an object as progress
  await job.updateProgress({ entries });

  return "Data fetched successfully";
}

// Create a worker instance for the "audio transcoding" queue
const worker = new Worker("flight-queue", processJob, {
  connection: {
    host: "localhost",
    port: 6379,
  },

});

// Log when the worker starts listening to jobs
console.log("Worker is listening to jobs...");

// Listen for completed jobs
worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

// Listen for failed jobs
worker.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed with error:`, err);
});
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);