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
                export PYTHONPATH=.
                export DATABASE_URL="sqlite:///:memory:"
                
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
            agent any
            steps {
                junit 'test-results.xml'
            }
        }
        failure {
            agent any
            steps {
                echo '❌ Tests failed! Check the console and test-results.xml for details.'
            }
        }
        success {
            agent any
            steps {
                echo '✅ All tests passed successfully!'
            }
        }
    }
}