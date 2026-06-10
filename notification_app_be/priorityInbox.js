/**
 * Priority Inbox Engine
 * Stage 6: Returns top-N notifications sorted by:
 *   1. Type weight: Placement (3) > Result (2) > Event (1)
 *   2. Recency (timestamp) as tiebreaker
 *
 * Uses a Min-Heap to efficiently maintain top-N as new notifications arrive
 */

const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

/**
 * Calculate priority score for a notification
 * Combines type weight and normalized recency
 */
function getPriorityScore(notification) {
  const typeWeight = TYPE_WEIGHT[notification.Type] || 0;
  // Timestamp as recency score (newer = higher)
  const recencyScore = new Date(notification.Timestamp).getTime() / 1e12;
  return typeWeight + recencyScore;
}

/**
 * MinHeap for top-N maintenance
 */
class MinHeap {
  constructor() {
    this.heap = [];
  }

  size() {
    return this.heap.length;
  }

  peek() {
    return this.heap[0];
  }

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
      const l = 2 * i + 1,
        r = 2 * i + 2;
      if (
        l < n &&
        this.heap[l].priorityScore < this.heap[smallest].priorityScore
      )
        smallest = l;
      if (
        r < n &&
        this.heap[r].priorityScore < this.heap[smallest].priorityScore
      )
        smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

/**
 * Get top-N priority notifications
 * @param {Array} notifications - raw notification array
 * @param {number} n - how many top notifications to return
 * @returns {Array} sorted top-n notifications (highest priority first)
 */
function getTopNNotifications(notifications, n = 10) {
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

  // Extract and sort descending (highest priority first)
  const result = [];
  while (heap.size() > 0) result.push(heap.pop());
  return result.reverse();
}

module.exports = { getTopNNotifications, getPriorityScore, TYPE_WEIGHT };
