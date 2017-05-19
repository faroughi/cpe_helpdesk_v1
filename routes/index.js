var express = require('express');
var router = express.Router();
var fs = require('fs');
var request = require('request');
var courseStore = JSON.parse(fs.readFileSync(process.cwd() + '/courses.json', 'utf8'));
var professorStore = JSON.parse(fs.readFileSync(process.cwd() + '/professors.json', 'utf8'));
var areaStore = JSON.parse(fs.readFileSync(process.cwd() + '/areas.json', 'utf8'));
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/bothandle', function (req, res, next) {
  var map = req.body.result;
  if (map.action === 'prerequisite') {
    var department = map.parameters.department;
    var number = map.parameters.number;
    push_course_details(res, department, number);
  }
  else if (map.action === 'professor_enquiry') {
    var lastName = map.parameters.lastName;
    var firstName = map.parameters.firstName;
    var enquiry = map.parameters.enquiry;
    push_professor_details(res, lastName, firstName, enquiry);
  }
  else if (map.action === 'interest_enquiry') {
    var area = map.parameters.area
    push_area_details(res, area);
  }
  else {
    var postBody = '{"question":"' + map.resolvedQuery + '"}';
    request({
      url: 'https://westus.api.cognitive.microsoft.com/qnamaker/v1.0/knowledgebases/' + process.env.QnAKnowledgebaseId + '/generateanswer',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.QnASubscriptionKey
      },
      body: postBody
    },
      function (error, response, body) {
        if (!error) {
          result = JSON.parse(body);
          if (result.answer === "No good match found in the KB") {
            res.status(200)
            res.set("Content-type", "application/json");
            res.send(JSON.stringify({
              "speech": "Sorry I am not able to answer your question at this moment. Please contact office. ",
              "displayText": "sorry I am not able to answer your question at this moment. Please contact office. ",
              "data": {},
              "contextOut": [],
              "source": "backend_service"
            }));
          }
          else {
            res.status(200)
            res.set("Content-type", "application/json");
            res.send(JSON.stringify({
              "speech": result.answer,
              "displayText": result.answer,
              "data": {},
              "contextOut": [],
              "source": "backend_service"
            }));
          }
        }
      }
    );

  }
});
// all helper functions go here
function push_course_details(res, department, number) {
  var answer = "", key = department + number;
  if (courseStore[key] === undefined) {
    answer = "There is no course such as " + key + " in our catlog. Please call office for more information";
  }
  else if (courseStore[key].prerequisites === "") {
    answer = "There are no prerequisites for " + key + ". ";
  }
  else {
    answer = "Prerequisites for " + key + " are " + courseStore[key].prerequisites + " .";
  }
  res.status(200)
  res.set("Content-type", "application/json");
  res.send(JSON.stringify({
    "speech": answer,
    "displayText": answer,
    "data": {},
    "contextOut": [{ "name": "lastCourse", "lifespan": 2, "parameters": { "department": department, "number": number } }],
    "source": "backend_service"
  }));
}
function push_professor_details(res, lastName, firstName, enquiry) {
  answer = ""
  for (var i = 0; i < professorStore.length; i++) {
    if (professorStore[i].firstName === firstName || professorStore[i].lastName === lastName) {
      if (enquiry === "email") {
        answer = professorStore[i].salutation + professorStore[i].lastName + "'s email is " + professorStore[i].email + ". Do you need any other details.";
      }
      else if (enquiry === "courses") {
        answer = professorStore[i].salutation + professorStore[i].lastName + " is teaching " + professorStore[i].courses + " next Semester. Would you like me to find any other information.";
      }
      else if (enquiry === "office hours") {
        answer = professorStore[i].salutation + professorStore[i].lastName + "'s office hours are " + professorStore[i].officeHours;
      }
      else {
        answer = "Sorry. I could not find this detail about " + professorStore[i].salutation + professorStore[i].lastName;
      }
      break;
    }
    else {
      answer = "Sorry, I could not find any details about the person you are looking for"
    }

  }
  res.status(200)
  res.set("Content-type", "application/json");
  res.send(JSON.stringify({
    "speech": answer,
    "displayText": answer,
    "data": {},
    "contextOut": [{ "name": "lastProfessor", "lifespan": 2, "parameters": { "lastName": lastName, "firstName": firstName } }],
    "source": "backend_service"
  }));

}
function push_area_details(res, area) {
  var answer = "";
  if (areaStore[area] === "")
    answer = "We dont have any courses in our catalogue that match " + area
  else
    answer = "If you are interested in " + area + ", here are some of the course we are offering: " + areaStore[area];
  res.status(200)
  res.set("Content-type", "application/json");
  res.send(JSON.stringify({
    "speech": answer,
    "displayText": answer,
    "data": {},
    "contextOut": [{ "name": "lastArea", "lifespan": 2, "parameters": { "area": area } }],
    "source": "backend_service"
  }));
}

module.exports = router;
