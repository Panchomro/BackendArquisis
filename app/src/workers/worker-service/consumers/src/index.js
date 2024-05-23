const { Worker, Job } = require("bullmq");
const axios = require("axios");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

async function fetchLatLonFromIP(ip) {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=lat,lon`);
    if (response.data && typeof response.data.lat === 'number' && typeof response.data.lon === 'number') {
      // console.log("Location fetched from IP:", response.data.lat, response.data.lon);
      return response.data;
    } else {
      console.error("No results found for the given IP:", ip);
      return null;
    }
  } catch (error) {
    console.error("Error fetching latitude and longitude from IP:", error);
    return null;
  }
}

async function fetchLocationFromAdress(address) {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.GOOGLE_API_KEY}`);
    if (response.data.results.length > 0) {
      const geometry = response.data.results[0].geometry; // Get the geometry object
      console.log("Location fetched from address:");
      return {
        lat: geometry.location.lat, 
        lon: geometry.location.lng 
      };
    } else {
      console.error("No results found for the given address:", address);
      return null; 
    }
  } catch (error) {
    console.error("Error fetching latitude and longitude from address:", error);
    return null;
  }
}


// Function to simulate processing of a job
async function processJob(job) {
  // Fetch last 20 entries from the database
  console.log("Processing job:", job.id);


  const { user_ip, user_id, flightData, flightsForWorkers } = job.data;

  
  //get location from ip
  const location = await fetchLatLonFromIP(user_ip);
 
  
  // Calculate top 3 recommendations
  let array_pond = [];
  let array_entries = [];
    
  for (let entry of flightsForWorkers) {
    const locationData = await fetchLocationFromAdress(entry.departure_airport_name);
    if (!locationData) {
      console.log("Failed to fetch address for entry:", entry);
      continue;
    }
    const lat = locationData.lat;
    const lon = locationData.lon;
    const ponderator = (Math.sqrt(( location.lat-lat) ** 2 + (location.lon - lon) ** 2))/entry.price;
    // console.log('Array_pond:', array_pond);
    // console.log('Ponderator:', ponderator);
    if (array_pond.length < 3){
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
  // console.log("Last 20 entries:", flightsForWorkers);
  const recommendations = {
    top_3_recommendations: array_entries
  }


  const response = {
    user_ip: user_ip,
    user_id: user_id,
    recommendations: recommendations
  };
  // Save recommendations to backend
  //   await axios.post(`http://app:${process.env.PORT}/recommendations`, {
  //     user_ip: user_ip,
  //     user_id: user_id,
  //     recommendations: recommendations
  //   });
  //   console.log("Recommendations saved to backend");
  // } catch (error) {
  //   console.error("Error saving recommendations to backend:", error);
  // }
  // Optionally report some progress
  await job.updateProgress(42);

  // Optionally sending an object as progress
  await job.updateProgress({ response });

  return { response: response };

}
// Create a worker instance
const worker = new Worker("flightQueue", processJob, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },

});

// Log when the worker starts listening to jobs
console.log("Worker is listening to jobs...");

// Listen for completed jobs
worker.on("completed", async (job, returnvalue) => {
  console.log(`Job ${job.id} completed successfully`);
  console.log("response:", returnvalue.response);
  try {
    // ${process.env.PORT}
    await axios.post(`http://app:${process.env.PORT}/recommendations`, {
      user_ip: returnvalue.response.user_ip,
      user_id:  returnvalue.response.user_id,
      recommendations: returnvalue.response.recommendations
    });
    console.log("Recommendations saved to backend");
  } catch (error) {
    console.error("Error saving recommendations to backend:", error);
  }


});



// Listen for failed jobs
worker.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed with error:`, err);
});

// worker.run();

// Function to handle shutdown
function shutdown() {
  worker.close().then(() => process.exit(0));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);