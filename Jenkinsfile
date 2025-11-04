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
                # We are now inside the container, and our
                # WORKDIR is /app (as set by your Dockerfile).
                
                # The 'app' and 'tests' folders are right here.
                # We set PYTHONPATH to '.' (the current dir)
                # so Python can find your 'app' module.
                
                export PYTHONPATH=.
                export DATABASE_URL="sqlite:///:memory:"
                
                # Run tests on the 'tests' folder, and tell
                # coverage to watch the 'app' folder.
                pytest tests \
                    -v \
                    --maxfail=1 \
                    --disable-warnings \
                    --cov=app \
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