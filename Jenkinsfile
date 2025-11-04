pipeline {
    agent none

    stages {
        stage('Checkout') {
            agent any
            steps {
                cleanWs() 
                git([branch: 'backend/add_testing', url: 'https://github.com/Hubersity/Hubersity.git'])
            }
        }

        stage('Run Tests') {
            agent {
                dockerfile {
                    dir 'backend'
                }
            }
            steps {
                sh '''
                # We are now inside the container.
                # The Dockerfile SHOULD have already run 'pip install'.
                # We don't need a venv.
                
                # These variables are still needed for the test session
                export PYTHONPATH=backend
                export DATABASE_URL="sqlite:///:memory:"
                
                # Run tests (paths are relative to the workspace root)
                pytest backend/tests \
                    -v \
                    --maxfail=1 \
                    --disable-warnings \
                    --cov=backend/app \
                    --cov-report=xml \
                    --junitxml=test-results.xml
                '''
            }
        }
    }

    post {
        always {
            junit 'test-results.xml'
        }
        failure {
            echo '❌ Tests failed! Check the console and test-results.xml for details.'
        }
        success {
            echo '✅ All tests passed successfully!'
        }
    }
}