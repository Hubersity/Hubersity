pipeline {
    agent {
        docker {
            [cite_start]image 'python:3.11' [cite: 1]
            [cite_start]args '-u' [cite: 1]
        }
    }

    environment {
        [cite_start]VENV_DIR = 'venv' [cite: 1]
        [cite_start]PYTHON = "${VENV_DIR}/bin/python" [cite: 1]
        [cite_start]PIP = "${VENV_DIR}/bin/pip" [cite: 1]
        [cite_start]ACTIVATE = ". ${VENV_DIR}/bin/activate" [cite: 1]
    [cite_start]} [cite: 2]

    stages {
        [cite_start]stage('Checkout') { [cite: 2]
            steps {
                [cite_start]git branch: 'backend/add_testing', url: 'https://github.com/Hubersity/hubersity.git' [cite: 2]
            }
        }

        [cite_start]stage('Setup Python Environment') { [cite: 2]
            steps {
                sh '''
                python -m venv ${VENV_DIR}
                ${ACTIVATE}
                ${PIP} install --upgrade pip setuptools wheel
                ${PIP} install -r backend/requirements.txt
                [cite_start]''' [cite: 3, 4]
            }
        }

        [cite_start]stage('Run Tests') { [cite: 4]
            steps {
                sh '''
                ${ACTIVATE}
                pytest backend/tests \
                    -v \
                    --maxfail=1 \
                    --disable-warnings \
                    --cov=backend/app \
                    --cov-report=xml \
                    --junitxml=test-results.xml
                [cite_start]''' [cite: 4, 5, 6]
            }
        }
    }

    post {
        always {
            [cite_start]junit 'test-results.xml' [cite: 6]
            [cite_start]cobertura autoUpdateHealth: false, autoUpdateStability: false, coberturaReportFile: 'coverage.xml' [cite: 7]
        }

        failure {
            echo '❌ Tests failed! [cite_start]Check the console and test-results.xml for details.' [cite: 7, 8]
        }

        success {
            [cite_start]echo '✅ All tests passed successfully!' [cite: 8, 9]
        }
    }
}