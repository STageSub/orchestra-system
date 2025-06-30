# Manual Verification Guide

Generated: 2025-06-28T23:06:11.861Z

## Problems Found: 6


### HIGH (1)


1. **Can create need for position with no musicians**
   - Impact: System allows creating needs that can never be filled
   - Details: {
  "position": "Tutti trumpet",
  "qualifiedMusicians": 0,
  "impact": "System allows creating needs that can never be filled",
  "suggestion": "UI should warn when creating need for position with no qualified musicians"
}
   



### UNEXPECTED (5)


1. **Error in test: Parallel Overbooking Risk**
   - Impact: See details
   - Details: {
  "error": "\nInvalid `prisma.projectNeed.create()` invocation in\n/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:147:41\n\n  144   where: { name: 'Tutti violin 1' }\n  145 })\n  146 \n→ 147 const need = await prisma.projectNeed.create({\n        data: {\n          projectId: 59,\n          positionId: 74,\n          quantity: 8,\n          requestStrategy: \"parallel\",\n          responseTimeHours: 48,\n      +   position: {\n      +     create: PositionCreateWithoutProjectNeedsInput | PositionUncheckedCreateWithoutProjectNeedsInput,\n      +     connectOrCreate: PositionCreateOrConnectWithoutProjectNeedsInput,\n      +     connect: PositionWhereUniqueInput\n      +   }\n        }\n      })\n\nArgument `position` is missing.",
  "stack": "PrismaClientValidationError: \nInvalid `prisma.projectNeed.create()` invocation in\n/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:147:41\n\n  144   where: { name: 'Tutti violin 1' }\n  145 })\n  146 \n→ 147 const need = await prisma.projectNeed.create({\n        data: {\n          projectId: 59,\n          positionId: 74,\n          quantity: 8,\n          requestStrategy: \"parallel\",\n          responseTimeHours: 48,\n      +   position: {\n      +     create: PositionCreateWithoutProjectNeedsInput | PositionUncheckedCreateWithoutProjectNeedsInput,\n      +     connectOrCreate: PositionCreateOrConnectWithoutProjectNeedsInput,\n      +     connect: PositionWhereUniqueInput\n      +   }\n        }\n      })\n\nArgument `position` is missing.\n    at kn (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:29:1363)\n    at Zn.handleRequestError (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:7102)\n    at Zn.handleAndLogRequestError (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:6784)\n    at Zn.request (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:6491)\n    at async l (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:130:9778)\n    at async testParallelOverbooking (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:147:16)\n    at async testProblem (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:70:5)\n    at async runAllTests (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:615:5)"
}
   


2. **Error in test: Inactive Musicians**
   - Impact: See details
   - Details: {
  "error": "\nInvalid `prisma.projectNeed.create()` invocation in\n/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:240:43\n\n  237   where: { projectId: { startsWith: TEST_PREFIX } }\n  238 })\n  239 \n→ 240 const need = await prisma.projectNeed.create({\n        data: {\n          projectId: 59,\n          positionId: 71,\n          quantity: 1,\n          requestStrategy: \"sequential\",\n          responseTimeHours: 48,\n      +   position: {\n      +     create: PositionCreateWithoutProjectNeedsInput | PositionUncheckedCreateWithoutProjectNeedsInput,\n      +     connectOrCreate: PositionCreateOrConnectWithoutProjectNeedsInput,\n      +     connect: PositionWhereUniqueInput\n      +   }\n        }\n      })\n\nArgument `position` is missing.",
  "stack": "PrismaClientValidationError: \nInvalid `prisma.projectNeed.create()` invocation in\n/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:240:43\n\n  237   where: { projectId: { startsWith: TEST_PREFIX } }\n  238 })\n  239 \n→ 240 const need = await prisma.projectNeed.create({\n        data: {\n          projectId: 59,\n          positionId: 71,\n          quantity: 1,\n          requestStrategy: \"sequential\",\n          responseTimeHours: 48,\n      +   position: {\n      +     create: PositionCreateWithoutProjectNeedsInput | PositionUncheckedCreateWithoutProjectNeedsInput,\n      +     connectOrCreate: PositionCreateOrConnectWithoutProjectNeedsInput,\n      +     connect: PositionWhereUniqueInput\n      +   }\n        }\n      })\n\nArgument `position` is missing.\n    at kn (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:29:1363)\n    at Zn.handleRequestError (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:7102)\n    at Zn.handleAndLogRequestError (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:6784)\n    at Zn.request (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:6491)\n    at async l (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:130:9778)\n    at async testInactiveMusiciansGetRequests (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:240:18)\n    at async testProblem (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:70:5)\n    at async runAllTests (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:620:5)"
}
   


3. **Error in test: Duplicate Requests**
   - Impact: See details
   - Details: {
  "error": "\nInvalid `prisma.projectNeed.create()` invocation in\n/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:390:41\n\n  387 \n  388 const position = await prisma.position.findFirst()\n  389 \n→ 390 const need = await prisma.projectNeed.create({\n        data: {\n          projectId: 59,\n          positionId: 108,\n          quantity: 1,\n          requestStrategy: \"sequential\",\n          responseTimeHours: 48,\n      +   position: {\n      +     create: PositionCreateWithoutProjectNeedsInput | PositionUncheckedCreateWithoutProjectNeedsInput,\n      +     connectOrCreate: PositionCreateOrConnectWithoutProjectNeedsInput,\n      +     connect: PositionWhereUniqueInput\n      +   }\n        }\n      })\n\nArgument `position` is missing.",
  "stack": "PrismaClientValidationError: \nInvalid `prisma.projectNeed.create()` invocation in\n/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:390:41\n\n  387 \n  388 const position = await prisma.position.findFirst()\n  389 \n→ 390 const need = await prisma.projectNeed.create({\n        data: {\n          projectId: 59,\n          positionId: 108,\n          quantity: 1,\n          requestStrategy: \"sequential\",\n          responseTimeHours: 48,\n      +   position: {\n      +     create: PositionCreateWithoutProjectNeedsInput | PositionUncheckedCreateWithoutProjectNeedsInput,\n      +     connectOrCreate: PositionCreateOrConnectWithoutProjectNeedsInput,\n      +     connect: PositionWhereUniqueInput\n      +   }\n        }\n      })\n\nArgument `position` is missing.\n    at kn (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:29:1363)\n    at Zn.handleRequestError (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:7102)\n    at Zn.handleAndLogRequestError (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:6784)\n    at Zn.request (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:6491)\n    at async l (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:130:9778)\n    at async testDuplicateRequests (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:390:16)\n    at async testProblem (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:70:5)\n    at async runAllTests (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:629:5)"
}
   


4. **Error in test: Modifying Active Needs**
   - Impact: See details
   - Details: {
  "error": "\nInvalid `prisma.projectNeed.create()` invocation in\n/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:442:41\n\n  439 \n  440 const position = await prisma.position.findFirst()\n  441 \n→ 442 const need = await prisma.projectNeed.create({\n        data: {\n          projectId: 59,\n          positionId: 108,\n          quantity: 2,\n          requestStrategy: \"parallel\",\n          responseTimeHours: 48,\n      +   position: {\n      +     create: PositionCreateWithoutProjectNeedsInput | PositionUncheckedCreateWithoutProjectNeedsInput,\n      +     connectOrCreate: PositionCreateOrConnectWithoutProjectNeedsInput,\n      +     connect: PositionWhereUniqueInput\n      +   }\n        }\n      })\n\nArgument `position` is missing.",
  "stack": "PrismaClientValidationError: \nInvalid `prisma.projectNeed.create()` invocation in\n/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:442:41\n\n  439 \n  440 const position = await prisma.position.findFirst()\n  441 \n→ 442 const need = await prisma.projectNeed.create({\n        data: {\n          projectId: 59,\n          positionId: 108,\n          quantity: 2,\n          requestStrategy: \"parallel\",\n          responseTimeHours: 48,\n      +   position: {\n      +     create: PositionCreateWithoutProjectNeedsInput | PositionUncheckedCreateWithoutProjectNeedsInput,\n      +     connectOrCreate: PositionCreateOrConnectWithoutProjectNeedsInput,\n      +     connect: PositionWhereUniqueInput\n      +   }\n        }\n      })\n\nArgument `position` is missing.\n    at kn (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:29:1363)\n    at Zn.handleRequestError (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:7102)\n    at Zn.handleAndLogRequestError (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:6784)\n    at Zn.request (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:6491)\n    at async l (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:130:9778)\n    at async testModifyingActiveNeed (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:442:16)\n    at async testProblem (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:70:5)\n    at async runAllTests (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:630:5)"
}
   


5. **Error in test: Project Deletion Impact**
   - Impact: See details
   - Details: {
  "error": "\nInvalid `prisma.projectNeed.create()` invocation in\n/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:499:41\n\n  496 \n  497 const position = await prisma.position.findFirst()\n  498 \n→ 499 const need = await prisma.projectNeed.create({\n        data: {\n          projectId: 60,\n          positionId: 108,\n          quantity: 1,\n          requestStrategy: \"sequential\",\n          responseTimeHours: 48,\n      +   position: {\n      +     create: PositionCreateWithoutProjectNeedsInput | PositionUncheckedCreateWithoutProjectNeedsInput,\n      +     connectOrCreate: PositionCreateOrConnectWithoutProjectNeedsInput,\n      +     connect: PositionWhereUniqueInput\n      +   }\n        }\n      })\n\nArgument `position` is missing.",
  "stack": "PrismaClientValidationError: \nInvalid `prisma.projectNeed.create()` invocation in\n/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:499:41\n\n  496 \n  497 const position = await prisma.position.findFirst()\n  498 \n→ 499 const need = await prisma.projectNeed.create({\n        data: {\n          projectId: 60,\n          positionId: 108,\n          quantity: 1,\n          requestStrategy: \"sequential\",\n          responseTimeHours: 48,\n      +   position: {\n      +     create: PositionCreateWithoutProjectNeedsInput | PositionUncheckedCreateWithoutProjectNeedsInput,\n      +     connectOrCreate: PositionCreateOrConnectWithoutProjectNeedsInput,\n      +     connect: PositionWhereUniqueInput\n      +   }\n        }\n      })\n\nArgument `position` is missing.\n    at kn (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:29:1363)\n    at Zn.handleRequestError (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:7102)\n    at Zn.handleAndLogRequestError (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:6784)\n    at Zn.request (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:121:6491)\n    at async l (/Users/bruskzanganeh/orchestra-system/node_modules/@prisma/client/runtime/library.js:130:9778)\n    at async testProjectDeletion (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:499:16)\n    at async testProblem (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:70:5)\n    at async runAllTests (/Users/bruskzanganeh/orchestra-system/scripts/real-problem-finder-test.js:631:5)"
}
   


## Next Steps

1. Manually verify each problem found
2. Prioritize critical and high severity issues
3. Create tickets for each confirmed problem
4. Fix before production deployment
