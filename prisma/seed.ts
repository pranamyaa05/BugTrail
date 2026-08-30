import { PrismaClient } from "@prisma/client";
import { recordAuditLog } from "../src/lib/audit";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.auditLog.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.flag.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.bugCC.deleteMany({});
  await prisma.savedQuery.deleteMany({});
  await prisma.whiningRule.deleteMany({});
  await prisma.bug.deleteMany({});
  await prisma.component.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  console.log("Seeding demo team & users...");
  const demoTeam = await prisma.team.create({
    data: {
      name: "Demo Workspace",
      joinCode: "DEMO-BUGTRAIL",
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "alice.admin@bugtrail.org",
      name: "Alice Vance (Lead Architect)",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Alice",
    },
  });

  const triager = await prisma.user.create({
    data: {
      email: "bob.triager@bugtrail.org",
      name: "Bob Martinez (Bug Triager)",
      passwordHash: defaultPasswordHash,
      role: "TRIAGER",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Bob",
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      email: "chaitanya.dev@bugtrail.org",
      name: "Chaitanya (Core Developer)",
      passwordHash: defaultPasswordHash,
      role: "DEVELOPER",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Chaitanya",
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: "eva.frontend@bugtrail.org",
      name: "Eva Lin (Frontend Specialist)",
      passwordHash: defaultPasswordHash,
      role: "DEVELOPER",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Eva",
    },
  });

  const reporter = await prisma.user.create({
    data: {
      email: "community.reporter@external.io",
      name: "Community Reporter",
      passwordHash: defaultPasswordHash,
      role: "REPORTER",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Reporter",
    },
  });

  // Assign team memberships
  await prisma.teamMember.createMany({
    data: [
      { teamId: demoTeam.id, userId: admin.id, role: "ADMIN" },
      { teamId: demoTeam.id, userId: triager.id, role: "TRIAGER" },
      { teamId: demoTeam.id, userId: dev1.id, role: "DEVELOPER" },
      { teamId: demoTeam.id, userId: dev2.id, role: "DEVELOPER" },
      { teamId: demoTeam.id, userId: reporter.id, role: "REPORTER" },
    ],
  });

  console.log("Seeding products & components...");
  const engine = await prisma.product.create({
    data: {
      teamId: demoTeam.id,
      name: "Core Engine (Gecko Next)",
      description: "High-performance browser layout and rendering engine",
      components: {
        create: [
          { name: "Layout & Rendering", description: "CSS Flexbox, Grid, and display list painting" },
          { name: "JavaScript JIT", description: "SpiderMonkey bytecode compiler and garbage collector" },
          { name: "Networking & HTTP3", description: "QUIC connection pooling and async socket pipeline" },
        ],
      },
    },
    include: { components: true },
  });

  const devtools = await prisma.product.create({
    data: {
      teamId: demoTeam.id,
      name: "Developer DevTools",
      description: "In-browser inspection, console, and performance tools",
      components: {
        create: [
          { name: "Network Monitor", description: "WebSocket and HAR capture inspector" },
          { name: "Debugger & Source Maps", description: "Wasm/TS step debugging and breakpoint engine" },
        ],
      },
    },
    include: { components: true },
  });

  const layoutComp = engine.components.find((c) => c.name === "Layout & Rendering")!;
  const jsComp = engine.components.find((c) => c.name === "JavaScript JIT")!;
  const netComp = engine.components.find((c) => c.name === "Networking & HTTP3")!;
  const debugComp = devtools.components.find((c) => c.name === "Debugger & Source Maps")!;

  console.log("Seeding sample bugs...");

  // Bug 1: Blocked Layout Bug (Assigned)
  const bug1 = await prisma.bug.create({
    data: {
      bugNumber: 101,
      key: "BUG-101",
      title: "CSS subgrid calculation regression in nested flexbox container",
      description: "When nesting a CSS grid with `grid-template-columns: subgrid` inside a `display: flex; flex-direction: column` wrapper, column tracks collapse to 0px on dynamic viewport resize.",
      status: "ASSIGNED",
      severity: "BLOCKER",
      priority: "P1",
      teamId: demoTeam.id,
      productId: engine.id,
      componentId: layoutComp.id,
      reporterId: reporter.id,
      assigneeId: dev1.id,
      customFields: JSON.stringify({ regressionBuild: "2026.04.1", os: "Linux x86_64, macOS ARM" }),
    },
  });

  await recordAuditLog({
    bugId: bug1.id,
    actorId: reporter.id,
    action: "CREATE",
    newValue: "Bug created with status UNCONFIRMED",
  });

  await recordAuditLog({
    bugId: bug1.id,
    actorId: triager.id,
    action: "STATUS_CHANGE",
    fieldChanged: "status",
    oldValue: "UNCONFIRMED",
    newValue: "ASSIGNED",
  });

  await prisma.comment.create({
    data: {
      bugId: bug1.id,
      authorId: dev1.id,
      body: "Reproduced locally on nightly build 2026.04.2. The issue appears to be an unhandled zero-intrinsic width edge case during track sizing in `nsGridContainerFrame.cpp`.",
    },
  });

  // Bug 2: JIT Compiler Crash (Resolved / Fixed)
  const bug2 = await prisma.bug.create({
    data: {
      bugNumber: 102,
      key: "BUG-102",
      title: "Wasm memory.grow out-of-bounds segfault on 4GB heap allocations",
      description: "Calling `memory.grow` near the 4GB boundary on 64-bit systems triggers an integer overflow in the virtual memory reservation check, causing an instant panic.",
      status: "RESOLVED",
      resolution: "FIXED",
      severity: "CRITICAL",
      priority: "P1",
      teamId: demoTeam.id,
      productId: engine.id,
      componentId: jsComp.id,
      reporterId: triager.id,
      assigneeId: dev1.id,
      resolvedAt: new Date(),
    },
  });

  await recordAuditLog({
    bugId: bug2.id,
    actorId: triager.id,
    action: "CREATE",
    newValue: "Bug created with status NEW",
  });

  await recordAuditLog({
    bugId: bug2.id,
    actorId: dev1.id,
    action: "STATUS_CHANGE",
    fieldChanged: "status",
    oldValue: "NEW",
    newValue: "RESOLVED",
  });

  await recordAuditLog({
    bugId: bug2.id,
    actorId: dev1.id,
    action: "RESOLUTION_CHANGE",
    fieldChanged: "resolution",
    oldValue: null,
    newValue: "FIXED",
  });

  await prisma.comment.create({
    data: {
      bugId: bug2.id,
      authorId: dev1.id,
      body: "Landed patch in commit `fa82c19`. Added 64-bit bounds clamping and added Wasm memory stress suite test case.",
    },
  });

  // Bug 3: DevTools Source Map issue (New)
  const bug3 = await prisma.bug.create({
    data: {
      bugNumber: 103,
      key: "BUG-103",
      title: "Breakpoints in TypeScript decorators map to generated JS lines instead of TS source",
      description: "When setting a breakpoint on a `@Injectable()` or method decorator line in TypeScript 5.5 projects, the debugger stops at the emitted `__decorate` helper in the bundled chunk.",
      status: "NEW",
      severity: "MAJOR",
      priority: "P2",
      teamId: demoTeam.id,
      productId: devtools.id,
      componentId: debugComp.id,
      reporterId: reporter.id,
      assigneeId: dev2.id,
    },
  });

  await recordAuditLog({
    bugId: bug3.id,
    actorId: reporter.id,
    action: "CREATE",
    newValue: "Bug created with status NEW",
  });

  // Bug 4: HTTP/3 Zero-RTT Handshake (Unconfirmed)
  const bug4 = await prisma.bug.create({
    data: {
      bugNumber: 104,
      key: "BUG-104",
      title: "0-RTT session resumption silently falls back to 1-RTT on TLS 1.3 key rotation",
      description: "Observed latency spike when client tickets expire during fast network transitions. 0-RTT early data fails without returning an explicit notification to the telemetry collector.",
      status: "UNCONFIRMED",
      severity: "NORMAL",
      priority: "P3",
      teamId: demoTeam.id,
      productId: engine.id,
      componentId: netComp.id,
      reporterId: reporter.id,
    },
  });

  await recordAuditLog({
    bugId: bug4.id,
    actorId: reporter.id,
    action: "CREATE",
    newValue: "Bug created with status UNCONFIRMED",
  });

  // Bug 5: Verified bug
  const bug5 = await prisma.bug.create({
    data: {
      bugNumber: 105,
      key: "BUG-105",
      title: "Memory leak in Network Monitor during long-running streaming WebSocket sessions",
      description: "Payload buffers were retained indefinitely in the devtools heap after frame disposal.",
      status: "VERIFIED",
      resolution: "FIXED",
      severity: "NORMAL",
      priority: "P3",
      teamId: demoTeam.id,
      productId: devtools.id,
      componentId: devtools.components[0].id,
      reporterId: triager.id,
      assigneeId: dev2.id,
      resolvedAt: new Date(),
    },
  });

  await recordAuditLog({
    bugId: bug5.id,
    actorId: triager.id,
    action: "CREATE",
    newValue: "Bug created with status NEW",
  });

  console.log("Database seeded successfully with Demo Workspace, 5 realistic bugs and verified audit chains!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });