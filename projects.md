# Testing

Figure out a way to integrate database seed data and Selenium or Puppeteer for testing UI.

Target COMP first, COMPOSE later

# Endorsements

Currently, we store a problem's state as "endorsed" or "idea" or "draft" etc. We
would like to instead infer from a new table "endorsements" whether or not a
problem is endorsed. Similar to if a problem can be "Published" (whether or not
its in the test_problems table). Need to update the `full_problems` view to get
the status.


# COMP

- Sign up page should look nicer
- should create join codes for org teams
  - i wrote the logic to handle putting students on org teams (and failing if not),
    but haven't actually written the logic that generates and stores a team join
    code
- need to look into eventbrite API and make it compatible with current stripe API
- need to look into stripe managed accounts so that the money goes directly to hosts


