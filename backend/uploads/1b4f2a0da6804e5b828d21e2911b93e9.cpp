#include <iostream>
#include <vector>
#include <queue>
#include <algorithm>
using namespace std;

struct Edge {
    int to, d;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int N, M, Q;
    cin >> N >> M >> Q;
    vector<vector<Edge>> adj(N+1);
    for (int i=0; i<M; i++) {
        int u, v, d;
        cin >> u >> v >> d;
        adj[u].push_back({v,d});
        adj[v].push_back({u,d});
    }
    vector<int> B(Q);
    for (int i=0; i<Q; i++) {
        cin >> B[i];
    }
    for (int b : B) {
        vector<int> dist(N+1, -1);
        queue<int> q;
        dist[1] = 0;
        q.push(1);
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            for (auto &e : adj[u]) {
                if (e.d <= b && dist[e.to] == -1) {
                    dist[e.to] = dist[u] + 1;
                    q.push(e.to);
                }
            }
        }
        int ans = 0;
        for (int i=1; i<=N; i++) {
            if (dist[i] > ans) {
                ans = dist[i];
            }  
        }
        cout << ans << "\n";
       
        
    }
    return 0;  
}