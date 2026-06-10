/**
 * Priority Inbox Engine - Stage 1
 *
 * Priority = Type Weight + Recency
 * Placement (3) > Result (2) > Event (1)
 *
 * Algorithm: Min-Heap of size N
 * - Maintains top-N efficiently as new notifications arrive
 * - O(M log N) time, O(N) space
 */

export const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

export function getPriorityScore(notification) {
  const typeWeight = TYPE_WEIGHT[notification.Type] ?? 0;
  const recencyScore = new Date(notification.Timestamp).getTime() / 1e12;
  return typeWeight + recencyScore;
}

// ---- Min-Heap ----
class MinHeap {
  constructor() {
    this.heap = [];
  }
  size() { return this.heap.length; }
  peek() { return this.heap[0]; }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].priorityScore <= this.heap[i].priorityScore) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l].priorityScore < this.heap[smallest].priorityScore) smallest = l;
      if (r < n && this.heap[r].priorityScore < this.heap[smallest].priorityScore) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

/**
 * Returns top-N notifications sorted by priority (highest first)
 * @param {Array} notifications
 * @param {number} n
 */
export function getTopNNotifications(notifications, n = 10) {
  const heap = new MinHeap();

  for (const notif of notifications) {
    const scored = { ...notif, priorityScore: getPriorityScore(notif) };
    if (heap.size() < n) {
      heap.push(scored);
    } else if (scored.priorityScore > heap.peek().priorityScore) {
      heap.pop();
      heap.push(scored);
    }
  }

  const result = [];
  while (heap.size() > 0) result.push(heap.pop());
  return result.reverse(); // highest priority first
}
