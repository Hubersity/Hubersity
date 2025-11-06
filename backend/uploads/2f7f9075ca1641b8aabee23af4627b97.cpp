#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

struct Account {
    long long X;
    int Q;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int N, M;
    cin >> N >> M;
    vector<Account> acc(N);
    for (int i=0; i<N; i++) {
        cin >> acc[i].X >> acc[i].Q;
    }
    sort(acc.begin(), acc.end(), [](auto &a, auto &b){ return a.Q < b.Q;});
    long long total = 0;
    int discard = 0;
    for (int i=0; i<M; i++) {
        int T, R;
        cin >> T >> R;
        bool ok = false;
        for (int j=0; j<N; j++) {
            if (acc[j].Q >= R && acc[j].X >= T) {
                acc[j].X -= T;
                total += 1LL * T * acc[j].Q;
                ok = true;
                break; 
            }
        }
        if (!ok) discard++;
        
    }
    cout << total << " " << discard << "\n";
    return 0;  
}