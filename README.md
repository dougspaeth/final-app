[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ioWGos6v)
**CMSI 2021** Web Application Development, Fall 2025

# Assignment 4
This is it, this is what we have been building toward: a web app fully conceived, designed, and implemented by you. By doing so, you will demonstrate the ability to ideate, design, and implement a beautiful, secure web application of your choice, using both a third-party API and a secure database, in a team of students, with well-defined roles, following modern development practices.

## Background Reading
All prior readings and resources can come into play here; no new baseline technical information is involved. Keep all prior links from all prior assignments handy.

New information may be required for specific solutions to specific issues in your specific app, and for that, we’ll want you to exercise the ability to search the web on your own while also knowing when the most effective overall use of everyone’s time is to ask questions directly.

## For Submission
Create a web app—that’s it!

🤔

Welllll, we _do_ want this app to be the culmination of what has been learned this semester. As such, your app must:
- Properly use authentication
- Communicate with at least one third-party web service API
- Use a database to persist application-specific information
- Be deployed to a public website

In addition, we will have you follow a [specific process](https://cs.lmu.edu/~ray/notes/ideation/) for _ideating_ your app. You will document this process as follows:
- Develop an _ideation.md_ file that records the results of your team’s _preliminary ideation_ process (we will work on this during the 1103 class session)
- Develop an _elevator pitch_ for your app, three (3) minutes max. Submit its outline/salient points in a _pitch.md_ file. We will share our pitches with each other during the week of 1105
- During the final exam slot designated by the registrar for this course, teams will give a final presentation and demo of their respective apps, five (5) minutes max. The content of this presentation will be captured in an _about.md_ file

Note that the above activities demand attendance due to both the nature of the process and out of respect to your teammates and fellow students. Please plan accordingly.

As before, continue to reinforce and build upon the skills you have already learned:
* Retrieval from and interaction with different back-ends
* Abstraction of back-end operations behind classes, objects, methods, and functions (async where appropriate)
* Appropriate user interface feedback for operations-in-progress
* Graceful error handling with messaging to the user when appropriate
* Responsive layout: It must look good on a narrow or wide screen
* Site balance and aesthetics: Make it a web app that people will want to keep visiting!

Due to the open-endedness of what your web app can be, we no longer have an all-or-nothing section. But please do use every possible technology, attribute, property, and technique at your disposal in order to make the best possible version of your app idea! 🖍️🛠️🧰🖌️

## Documentation Outlines/Templates
Use the following outlines to drive what goes into _ideation.md_, _pitch.md_, and _about.md_. Note that the first two items are clearly derived from the [ideation process](https://cs.lmu.edu/~ray/notes/ideation/) on Dr. Toal’s website. The _about.md_ outline should also serve as a guide to your final presentation.

### _ideation.md_—Preliminary Ideation Journal (due 1105)
1. Which audiences did you consider, and which one did you settle on for your app?
2. List the ten needs that you identified for your chosen audience
3. State the three needs that were chosen out of the ten, and state the projects that you mapped to those needs
4. For each of the three projects, list the goals/ideas that you brainstormed for them
5. State the “winner” of this process

### _pitch.md_—Elevator Pitch (due 1105)
Combining your preliminary ideation content and the feedback heard on 1103…
1. State the final inspiration statement that you crafted for your chosen audience
2. State the possible solutions from preliminary ideation that you considered
3. State the final app idea that your team has decided to do

### _about.md_—Final Presentation/Description of Your Web App (due by final exam slot)
* Provide a title for your overall project (it doesn’t have to be the app’s name, but it should certainly describe it)
* Provide the web app’s publicly-deployed URL
* List your team and supply your general roles
* Explain your user audience and their needs
* Show a brief demo of your app
* State technology highlights: the API(s) you use, what you store in your database, anything cool, hot, challenging, or annoying/frustrating
* List any acknowledgements/thanks/credits
* 👏🏼👏🏼👏🏼

## Operational Tips/Suggestions
* Preliminary ideation should give you sufficient scope to start developing the software, so don’t wait to do that with your team so that software development can commence! The semester will be over before you know it. The ideation exercises and elevator pitch will refine your app idea and how you express it to others but are not expected to cause your app to change drastically
* Note again that the wealth of possibilities means that self-study and experimentation are built into the work involved with this assignment. Make sure to plan accordingly! Learning the material together will help, with multiple eyes looking at the same documentation
* You _will_ make mistakes, change your mind about features, or run into dead ends, all of which will take time—ideally, _build that time in_ when planning out how you will work on the app
* Many operational tips and suggestions from the past assignments also still apply—don’t hestitate to review them!

## How to Turn it In
Commit the following to your designated GitHub Classroom-supplied repository:
- Complete React project with all code and assets; the app should run directly from a `git clone` followed by `npm install` and `npm start`, with no further intervention
- Any needed API identifiers/keys—if you prefer not to commit these (and you shouldn’t in future work), find a way to convey these privately!
- Firebase configuration file _src/firebaseConfig.js_ (or else we won’t be able to run your app!)
- _ideation.md_—must be submitted by **1105**
- _pitch.md_—must be submitted by **1105**, will be delivered in class on the week of 1105
- _ai_review.md_-write about how you used AI for this final project, what worked well and what did not
- _about.md_—you may use different visuals for your final presentations (e.g., a slide or video presentation), but your presentation’s _content_ must be delivered in a form suitable for reading as this Markdown file

## Specific Point Allocations
For this particular assignment, graded categories are as follows:

| Category | Points |
| -------- | -----: |
| _ideation.md_ | 30 points total |
| • Developed and workshopped in class | deduction only (if not fulfilled) |
| • Audiences | 5 points |
| • Ten (10) needs | 10 points |
| • Three (3) projects | 6 points |
| • Three (3) sets of goals/ideas | 6 points |
| • Project choice | 3 points |
| • Submitted by designated date | deduction only (if not fulfilled) |
| _pitch.md_ | 30 points total |
| • Inspiration statement | 10 points |
| • Possible solutions | 12 points |
| • Final app idea | 8 points |
| • Presented in class | deduction only (if not fulfilled) |
| • Submitted by designated date | deduction only (if not fulfilled) |
| _about.md_ | 45 points total |
| • Project title | 2 points |
| • Link to public deployment | 1 points |
| • Team names and roles | 6 points |
| • Audience and their needs | 6 points |
| • App screenshots/video/demo | 20 points |
| • Technology highlights | 10 points |
| • Credits where appropriate | deduction only (if not done) |
| • Presented successfully on finals week | deduction only (if not fulfilled) |
| AI_Review | 5 points total |
| Baseline functionality | 40 points total |
| • Third-party web service API | 15 points |
| • Authentication | 10 points |
| • Database | 15 points |
| Baseline code quality | 50 points total |
| This is a composite score indicating how successfully the code has:<br/>• Fully-abstracted service modules<br/>• Warning- and error-free developer console<br/>• Sensible implementation choices | |
| Design & usability | 50 points total |
| This is a composite score indicating how successfully the app demonstrates:<br/>• Responsive design<br/>• Effective aesthetic choices<br/>• Helpful feedback, especially when waiting for asynchronous operations<br/>• Graceful error handling (e.g., when a network request fails) | |
| Hard-to-maintain or error-prone code | deduction only |
| Hard-to-read code | deduction only |
| Version control | deduction only |
| Punctuality | deduction only |
| **Total** | **250** |

Note that inability to compile and run any code to begin with will negatively affect other criteria, because if we can’t run your code, we can’t evaluate related remaining items completely.
