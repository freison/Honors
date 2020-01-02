import React, { Component } from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet, Modal, Button, Alert, PanResponder, Share } from 'react-native';
import { Card, Icon, Rating, AirbnbRating, Input } from 'react-native-elements';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite, postComment } from '../redux/ActionCreators';
import * as Animatable from 'react-native-animatable';

const mapStateToProps = state => {
    return {
        dishes: state.dishes,
        comments: state.comments,
        favorites: state.favorites
    }
}

const mapDispatchToProps = dispatch => ({
    postFavorite: (dishId) => dispatch(postFavorite(dishId)),
    //--- Line added
    postComment: (dishId, rating, author, comment) => dispatch(postComment(dishId, rating, author, comment))
});

function RenderDish(props) {
    const dish = props.dish;

    handleViewRef = ref => this.view = ref;
    handleViewRef2 = ref => this.view = ref;

    const recognizeDrag = ({ moveX, moveY, dx, dy }) => {
        if (dx < -200)
            return true;

        else
            return false;
    };

    const recognizeComment = ({ moveX, moveY, dx, dy }) => {
        if (dx > 200)
            return true;

        else
            return false;
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: (e, gestureState) => {
            return true;
        },
        onPanResponderGrant: () => {
            this.view.rubberBand(1000)
                .then(endState => console.log(endState.finished ? 'finished' : 'cancelled'))
        },
        onPanResponderEnd: (e, gestureState) => {
            if (recognizeDrag(gestureState))
                Alert.alert(
                    'Add to Favorites?',
                    'Are you sure you wish to add ' + dish.name + ' to your favorites?',
                    [
                        {
                            text: 'Cancel',
                            onPress: () => console.log('Cancel pressed'),
                            style: 'cancel'
                        },
                        {
                            text: 'OK',
                            onPress: () => props.favorite ? console.log('Already favorite') : props.onPress()
                        }
                    ],
                    { cancelable: false }
                )

            else if (recognizeComment(gestureState))
                props.onTest();
            return true;
        }
    });

    const shareDish = (title, message, url) => {
        Share.share({
            title: title,
            message: title + ': ' + message + ' ' + url,
            url: url
        }, {
            dialogTitle: 'Share ' + title
        });
    }

    if (dish != null) {
        return (
            <Animatable.View animation="fadeInDown" duration={500} delay={500}
                ref={this.handleViewRef}
                {...panResponder.panHandlers}

            >
                <Card
                    featuredTitle={dish.name}
                    image={{ uri: baseUrl + dish.image }}
                >
                    <Text style={{ margin: 10 }}>
                        {dish.description}
                    </Text>
                    <View style={styles.formRow}>
                        <Icon
                            raised
                            reverse
                            name={props.favorite ? 'heart' : 'heart-o'}
                            type='font-awesome'
                            color='#f50'
                            onPress={() => props.favorite ? console.log('Already favorite') : props.onPress()}
                        />
                        <Icon
                            raised
                            reverse
                            name='pencil'
                            type='font-awesome'
                            color='#512DA8'
                            onPress={() => props.onTest()}
                        />
                        <Icon
                            raised
                            reverse
                            name='share'
                            type='font-awesome'
                            color='#51D2A8'
                            onPress={() => shareDish(dish.name, dish.description, baseUrl + dish.image)}
                        />
                    </View>
                </Card>
            </Animatable.View>
        );
    }
    else {
        return (<View></View>)
    }
}

function RenderComments(props) {
    const comments = props.comments;

    const renderCommentItem = ({ item, index }) => {
        return (
            <View key={index} style={{ margin: 10 }}>
                <Text style={{ fontSize: 14 }}>{item.comment}</Text>
                <Text style={{ fontSize: 12 }}>{item.rating}</Text>
                <Rating
                    imageSize={10}
                    readonly
                    startingValue={item.rating}
                    style={{ paddingVertical: 10, PaddingRight: 20 }}
                />
                <Text style={{ fontSize: 12 }}>{'-- ' + item.author + ', ' + item.date}</Text>
            </View>
        );
    }

    return (
        <Animatable.View animation="fadeInUp" duration={500} delay={500}>
            <Card title='Comments'>
                <FlatList
                    data={comments}
                    renderItem={renderCommentItem}
                    keyExtractor={item => item.id.toString()}
                />
            </Card >
        </Animatable.View>
    );
}

class Dishdetail extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showModal: false,
            author: '',
            comment: '',
            rate: 5
        };
        this.handleComment = this.handleComment.bind(this);
        this.ratingCompleted = this.ratingCompleted.bind(this);
    }

    ratingCompleted(rating) {
        this.setState({ rate: rating })
    }

    toogleModal() {
        this.setState({ showModal: !this.state.showModal })
    }

    sModal() {
        this.toogleModal();
        console.log(!this.props.showModal);
    }

    markFavorite(dishId) {
        this.props.postFavorite(dishId);
    }

    //--- New method
    handleComment(dishId, rating, author, comment) {
        this.props.postComment(dishId, rating, author, comment);
    }

    static navigationOptions = {
        title: 'Dish Detail'
    };

    render() {
        //dishId, rating, author, comment
        const dishId = this.props.navigation.getParam('dishId', '');
        //--- Lines addes
        const rating = this.state.rate;
        const author = this.state.author;
        const comment = this.state.comment;
        return (
            <ScrollView>
                <RenderDish dish={this.props.dishes.dishes[+dishId]}
                    favorite={this.props.favorites.some(el => el === dishId)}
                    onPress={() => this.markFavorite(dishId)}
                    onTest={() => this.sModal()}
                />
                <RenderComments comments={this.props.comments.comments.filter((comment) => comment.dishId === dishId)} />
                <Modal
                    animationType={'slide'}
                    transparent={false}
                    visible={this.state.showModal}
                    onDismiss={() => { this.toogleModal(); }}
                    onRequestClose={() => { this.toogleModal(); }}
                >
                    <View style={styles.modal}>
                        <Rating
                            ratingCount={5}
                            startingValue={5}
                            showRating
                            onFinishRating={this.ratingCompleted}
                        />
                        <Input
                            model=".author" id="author" name="author"
                            onChangeText={(author) => this.setState({ author })}
                            value={this.state.author}
                            placeholder=' Author'
                            leftIcon={
                                <Icon
                                    name='user-o'
                                    size={24}
                                    color='black'
                                    type='font-awesome'
                                />
                            }
                        />
                        <Input
                            placeholder=' Comment'
                            model=".comment" id="comment" name="comment"
                            onChangeText={(comment) => this.setState({ comment })}
                            value={this.state.comment}
                            leftIcon={
                                <Icon
                                    name='comment-o'
                                    size={24}
                                    color='black'
                                    type='font-awesome'
                                />
                            }
                        />
                        <View style={styles.modalText}>
                            <Button
                                onPress={(values) => { this.handleComment(dishId, rating, author, comment, values); }}
                                type='submit'
                                color='#512DA8'
                                title='Submit'
                            />
                        </View>
                        <View style={styles.modalText}>
                            <Button
                                onPress={() => { this.toogleModal(); }}
                                color='gray'
                                title='Close'
                            />
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        )
    }
}

const styles = StyleSheet.create({
    formRow: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        flexDirection: 'row',
        margin: 20
    },
    formLabel: {
        fontSize: 18,
        flex: 2
    },
    formItem: {
        flex: 1
    },
    modal: {
        justifyContent: 'center',
        margin: 20
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        backgroundColor: '#512DA8',
        textAlign: 'center',
        color: 'white',
        marginBottom: 20
    },
    modalText: {
        fontSize: 18,
        margin: 10
    }
});


export default connect(mapStateToProps, mapDispatchToProps)(Dishdetail);