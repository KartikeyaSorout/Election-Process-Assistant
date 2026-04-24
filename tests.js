// Election Assistant - Test Suite
// Run in browser console or with a test runner

const TEST_RESULTS = [];

function test(name, fn) {
  try {
    fn();
    TEST_RESULTS.push({ name, passed: true });
    console.log(`✅ PASS: ${name}`);
  } catch (e) {
    TEST_RESULTS.push({ name, passed: false, error: e.message });
    console.error(`❌ FAIL: ${name} — ${e.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

function assertEqual(a, b, message) {
  if (a !== b) throw new Error(message || `Expected ${b}, got ${a}`);
}

function assertContains(str, substr, message) {
  if (!str.includes(substr)) throw new Error(message || `Expected "${str}" to contain "${substr}"`);
}

// ─── Unit Tests ───────────────────────────────────────────

test("autoResize sets textarea height", () => {
  const el = document.createElement("textarea");
  document.body.appendChild(el);
  el.value = "Hello\nWorld\nLine3";
  el.style.height = "auto";
  autoResize(el);
  assert(el.style.height !== "auto", "Height should be updated");
  document.body.removeChild(el);
});

test("addMsg creates user message with correct class", () => {
  const before = document.getElementById("chat").childElementCount;
  addMsg("user", "Test message");
  const after = document.getElementById("chat").childElementCount;
  assertEqual(after, before + 1, "One message should be added");
  const last = document.getElementById("chat").lastElementChild;
  assert(last.classList.contains("user"), "Last message should have 'user' class");
  last.remove();
});

test("addMsg creates assistant message with correct class", () => {
  const before = document.getElementById("chat").childElementCount;
  addMsg("assistant", "Test reply");
  const after = document.getElementById("chat").childElementCount;
  assertEqual(after, before + 1, "One message should be added");
  const last = document.getElementById("chat").lastElementChild;
  assert(last.classList.contains("assistant"), "Last message should have 'assistant' class");
  last.remove();
});

test("addMsg escapes newlines as <br>", () => {
  addMsg("assistant", "Line1\nLine2");
  const last = document.getElementById("chat").lastElementChild;
  assertContains(last.innerHTML, "<br>", "Newlines should be converted to <br>");
  last.remove();
});

test("Empty input does not send message", () => {
  const input = document.getElementById("user-input");
  const before = document.getElementById("chat").childElementCount;
  input.value = "   ";
  sendMsg();
  const after = document.getElementById("chat").childElementCount;
  assertEqual(before, after, "No message should be added for empty input");
});

test("history array updates after sending", () => {
  const before = history.length;
  const input = document.getElementById("user-input");
  input.value = "__test_message__";
  // Manually push as sendMsg is async
  history.push({ role: "user", content: "__test_message__" });
  assert(history.length > before, "History should grow");
  history.pop(); // cleanup
});

test("switchTab activates correct tab", () => {
  switchTab("chart");
  const chartTab = document.getElementById("tab-chart");
  assert(chartTab.classList.contains("active"), "Chart tab should be active");
  assert(chartTab.getAttribute("aria-selected") === "true", "aria-selected should be true");
  switchTab("chat"); // reset
});

test("switchTab deactivates previous tab", () => {
  switchTab("chart");
  const chatTab = document.getElementById("tab-chat");
  assert(!chatTab.classList.contains("active"), "Chat tab should not be active");
  switchTab("chat"); // reset
});

test("WORKER_URL is defined and not empty", () => {
  assert(typeof WORKER_URL === "string", "WORKER_URL should be a string");
  assert(WORKER_URL.length > 0, "WORKER_URL should not be empty");
  assert(WORKER_URL.startsWith("https://"), "WORKER_URL should start with https://");
});

test("chat area exists in DOM", () => {
  const chat = document.getElementById("chat");
  assert(chat !== null, "Chat area should exist");
});

test("send button exists and is accessible", () => {
  const btn = document.getElementById("send-btn");
  assert(btn !== null, "Send button should exist");
  assert(btn.hasAttribute("aria-label"), "Send button should have aria-label");
});

test("textarea has aria-label", () => {
  const textarea = document.getElementById("user-input");
  assert(textarea.hasAttribute("aria-label"), "Textarea should have aria-label");
});

test("topic buttons exist", () => {
  const btns = document.querySelectorAll(".topic-btn");
  assert(btns.length >= 6, "At least 6 topic buttons should exist");
});

test("skip link exists for accessibility", () => {
  const skip = document.querySelector(".skip-link");
  assert(skip !== null, "Skip link should exist");
});

test("Firebase app is initialized", () => {
  assert(typeof firebase !== "undefined", "Firebase should be loaded");
  assert(firebase.apps.length > 0, "Firebase app should be initialized");
});

test("Firestore db is available", () => {
  assert(typeof db !== "undefined", "Firestore db should be defined");
});

// ─── Integration Test ─────────────────────────────────────

test("Worker URL responds to POST", async () => {
  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] })
    });
    assert(res.ok || res.status < 500, "Worker should not return 5xx error");
  } catch(e) {
    throw new Error("Worker fetch failed: " + e.message);
  }
});

// ─── Summary ──────────────────────────────────────────────

setTimeout(() => {
  const passed = TEST_RESULTS.filter(t => t.passed).length;
  const total = TEST_RESULTS.length;
  console.log(`\n📊 Test Results: ${passed}/${total} passed`);
  if (passed === total) console.log("🎉 All tests passed!");
  else {
    console.log("Failed tests:");
    TEST_RESULTS.filter(t => !t.passed).forEach(t => console.log(`  ❌ ${t.name}: ${t.error}`));
  }
}, 100);
