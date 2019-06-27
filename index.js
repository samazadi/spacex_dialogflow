// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
const axios = require('axios');

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
// const { Card, Suggestion } = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function getInfoByYearHandler(agent) {
    const launchYear = agent.parameters.launchYear;
    const url = 'https://api.spacexdata.com/v3/launches';
    return axios.get(`${url}?launch_year=${launchYear}&order=desc`)
      .then(res => {
        const launchData = res.data;
        agent.add(`There were ${launchData.length} launches in ${launchYear}. The last launch mission was called ${launchData[0].mission_name} using the ${launchData[0].rocket.rocket_name}. Ask me about the ${launchData[0].rocket.rocket_name}!`);
      });
  }

  function getMissionDataHandler(agent) {
    const url = 'https://api.spacexdata.com/v3/missions';
    agent.add('Some recent missions are:');
    return axios.get(`${url}?limit=3`)
      .then(res => {
        const missionData = res.data;
        missionData.map(mission => {
          agent.add(mission.mission_name);
        });
      });
  }

  function getInfoDataHandler(agent) {
    const url = 'https://api.spacexdata.com/v3/info';
    return axios.get(url)
      .then(res => {
        const info = res.data;
        agent.add(info.summary);
      });
  }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Launches', getInfoByYearHandler);
  intentMap.set('Missions', getMissionDataHandler);
  intentMap.set('Info', getInfoDataHandler);
  agent.handleRequest(intentMap);
});
