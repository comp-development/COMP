# Load Testing Notes

# fake-users.ts

Run the below command(from root directory of COMP) in order to create 10 fake users

```
npx tsx src/lib/scripts/load-test.ts 
```
Usernames will be student{i}@gmail.com from i = 1 to 10. 
This creates 10 empty accounts that will be used to simulate the load test.

# test-taker.ts
This is one sample load test, and is very basic. It will use a single sample user (student@gmail.com) and will update the answer to a test 100 times. It will verify that the value in the database is the last answer.

Run the below command(from root directory of COMP) in order to run the test

```
npx tsx src/lib/scripts/test-taker.ts 
```

# load-test.ts
This the actual load test. It will take the 10 student accounts (student@gmail.com ... student9@gmail.com) created with fake-users.ts, take the inputted test pick a problem at random from the given list, and keep saving new answers. 

Note, before this test is run, you need to manually go log in to each student account and start a test. Yes, this is annoying, and will ideally add this to test-students. Note the id and event of the test in the database, and pass them as inputs at the top of load-tests.ts file. Also, note a few problem on the given test (and input them at the top of load-tests.ts). 

Run the below command(from root directory of COMP) in order to run the load test

```
npx tsx src/lib/scripts/test-taker.ts 
```
