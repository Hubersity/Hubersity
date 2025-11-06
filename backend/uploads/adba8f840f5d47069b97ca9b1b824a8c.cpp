#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int M, N, L;
    cin >> M >> N >> L;
    vector<int> P(N+1);
    for (int i=1; i <=N; i++) {
        cin >> P[i];
    }
    vector<int> S;
    for (int i=0; i<L; i++) {
        int T;
        cin >> T;
        if (T==1) {
            int idx;
            cin >> idx;
            S.push_back(P[idx]);
        } else if (T==2) {
            int a = S.back();
            S.pop_back();
            int b = S.back();
            S.pop_back();
            S.push_back(a);
            S.push_back(b);
        } else if (T==3) {
            int a, b, c;
            cin >> a >> b >> c;
            int x = S.back();
            S.pop_back();
            int y = S.back();
            S.pop_back();
            int z = (a*x + b*y + c) % M;
            S.push_back(z);
        } else if (T==4) {
            int idx, a, b, c;
            cin >> idx >> a >> b >> c;
            int y = S.back();
            S.pop_back();
            int x = P[idx];
            int z = (a*x + b*y + c) % M;
            S.push_back(z);
        }
           
    }
    cout << S.back() << "\n";
    return 0;
}