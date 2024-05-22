const { Worker, Job } = require("bullmq");
const axios = require("axios");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

// console.log("logs consumer");
// console.log('REDIS_HOST:', process.env.REDIS_HOST);
// console.log('REDIS_PORT:', process.env.REDIS_PORT);
// console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD);
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

  const { user_ip, user_id, flightData, flightsForWorkers } = job.data;

  
  //get location from ip
  const location = await fetchLatLonFromIP(user_ip);
  if (!location) {
    console.log("Failed to fetch latitude and longitude for IP:", ip);
  }
  
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
  console.log("Last 20 entries:", flightsForWorkers);

  // Save recommendations to backend
  try {
    await axios.post(`${process.env.PORT}/recommendations`, {
      user_ip: ip,
      user_id: user_id,
      recommendations: array_entries.slice(0, 3),
    });
    console.log("Recommendations saved to backend");
  } catch (error) {
    console.error("Error saving recommendations to backend:", error);
  }
  // Optionally report some progress
  await job.updateProgress(42);

  // Optionally sending an object as progress
  await job.updateProgress({ flightsForWorkers });

  return { recommendations: array_entries.slice(0, 3) };
}

// Create a worker instance
const worker = new Worker("flight-queue", processJob, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },

});

// Log when the worker starts listening to jobs
console.log("Worker is listening to jobs...");

// Listen for completed jobs
worker.on("completed", (job, returnvalue) => {
  console.log(`Job ${job.id} completed successfully`);
  console.log("Recommendations:", returnvalue.recommendations);


});

// Listen for failed jobs
worker.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed with error:`, err);
});
// Function to handle shutdown
function shutdown() {
  worker.close().then(() => process.exit(0));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);